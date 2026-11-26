import React, { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../../context/AppContext';
import { discardPrintDocument, pickPrintDocument, savePrintDocument } from '../../services/printDocuments';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Card from '../../components/Card';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import QuantitySelector from '../../components/QuantitySelector';
import SectionHeader from '../../components/SectionHeader';
import SegmentedControl from '../../components/SegmentedControl';
import StickyBar from '../../components/StickyBar';
import BagAdditionNotice from '../../components/BagAdditionNotice';
import { AnimatedNumber, AnimatedProgressBar, PressableScale, ShakeView, animateLayout, useScreenFocusAnimation, useToast } from '../../components/motion';
import { MAX_FONT_SCALE, spacing } from '../../theme/theme';
import { countPrintedPages, printOptionsFor } from '../../utils/cart';
import { calcPrintPrice, formatMoney } from '../../utils/money';
import { closedReason, isStoreOpen } from '../../utils/time';
import { positiveWholeNumber, validatePrintJob } from '../../utils/validation';
import { detectPages, fileKind, formatFileSize, validateFile } from '../../utils/pdfPages';
import * as haptics from '../../utils/haptics';
import { createStyles } from './PrintScreen.styles';
import useThemedStyles from '../../hooks/useThemedStyles';
import { useTheme } from '../../context/ThemeContext';

const SAMPLE_FILES = ['Lab_Report_3.pdf', 'Thesis_Draft_v2.pdf', 'Marketing_Case_Study.pdf', 'Circuit_Analysis_HW4.pdf', 'Lecture_Notes_Week6.pdf'];
const BINDINGS = [
  { key: 'none', label: 'None' },
  { key: 'staple', label: 'Staple' },
  { key: 'spiral', label: 'Spiral' },
];
const EMPTY_FORM = { file: null, pages: '', copies: '1', color: false, doubleSided: false, binding: 'none' };

// Icon, label and colour token for each file type in the file chip
const FILE_KINDS = {
  pdf: { icon: 'document-text', label: 'PDF', tone: 'dangerSolid' },
  word: { icon: 'document', label: 'Word', tone: 'primary' },
  image: { icon: 'image', label: 'Image', tone: 'successSolid' },
};

const readPdfText = async (file) => file.browserFile
  ? file.browserFile.text()
  : atob(await FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' }));

// Print: controlled inputs, SegmentedControl/Switch/Chips and a live price that pulses when it changes
export default function PrintScreen({ navigation, route }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { campus, cart, getStore, addToCart, replaceCart, updatePrintJob, timeOffsetMs, reduceMotion } = useApp();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { showToast, showBagAddition } = useToast();
  const { animatedStyle } = useScreenFocusAnimation();
  const editKey = route.params?.editKey;
  const editing = route.name === 'EditPrintJob';
  const editItem = editing && cart.storeId === 'printing'
    ? cart.items.find((item) => item.key === editKey && item.type === 'print')
    : null;
  const [form, setForm] = useState(() => {
    if (!editItem) return EMPTY_FORM;
    const options = printOptionsFor(editItem);
    return {
      ...EMPTY_FORM,
      file: { name: editItem.file?.fileName || editItem.name, size: editItem.file?.fileSize, mimeType: editItem.file?.mimeType },
      pages: String(options?.pages ?? ''),
      copies: String(options?.copies ?? 1),
      color: options?.color === true,
      doubleSided: options?.doubleSided === true,
      binding: BINDINGS.some(({ key }) => key === options?.binding) ? options.binding : 'none',
    };
  });
  const [touchedPages, setTouchedPages] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [conflictVisible, setConflictVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setAvailabilityTick] = useState(0);
  const [fileError, setFileError] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const selectedFile = useRef(null);
  const pickRequest = useRef(0);
  const submitting = useRef(false);
  const fileShakeRef = useRef(null);
  const totalScale = useRef(new Animated.Value(1)).current;

  const store = getStore('printing');
  const isOpen = isStoreOpen(store, timeOffsetMs);
  const prices = campus.printPrices;
  const jobQuantity = editItem?.qty ?? 1;
  const price = calcPrintPrice(form, prices);
  const pagesInBag = cart.storeId === 'printing'
    ? countPrintedPages(editItem ? cart.items.filter((item) => item !== editItem) : cart.items)
    : 0;
  const errors = validatePrintJob(form, prices.maxPages);
  const pages = positiveWholeNumber(form.pages);
  const copies = positiveWholeNumber(form.copies) || 1;
  const printedPages = price.printedPages * jobQuantity;
  const sheets = price.sheets * jobQuantity;
  const total = price.total * jobQuantity;
  if (printedPages && printedPages + pagesInBag > prices.maxPages) {
    errors.limit = 'The order is limited to ' + prices.maxPages + ' printed pages across all jobs.';
  }
  const maxCopies = Math.max(0, Math.floor((prices.maxPages - pagesInBag) / ((pages || 1) * jobQuantity)));
  const canIncrease = copies < maxCopies;
  const overLimit = Boolean(errors.limit);

  useEffect(() => {
    if (!focused) return;
    const timer = setInterval(() => setAvailabilityTick((tick) => tick + 1), 10000);
    return () => clearInterval(timer);
  }, [focused]);

  useEffect(() => {
    if (reduceMotion || price.total === 0) return;
    Animated.sequence([
      Animated.timing(totalScale, { toValue: 1.06, duration: 120, useNativeDriver: true }),
      Animated.spring(totalScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [total, reduceMotion, totalScale]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateAnimated = (field, value) => {
    animateLayout();
    update(field, value);
  };

  const selectFile = (file, suggestedPages = null, resetForm = false) => {
    selectedFile.current = file;
    setFileError('');
    setTouchedPages(false);
    setDetecting(false);
    setSuggestion(suggestedPages ? { pages: suggestedPages, sample: true } : null);
    if (resetForm) setForm(EMPTY_FORM);
    else {
      animateLayout();
      setForm((prev) => ({ ...prev, file, pages: suggestedPages ? String(suggestedPages) : '' }));
    }
  };

  const pickFile = async () => {
    const request = ++pickRequest.current;
    try {
      const file = await pickPrintDocument();
      if (!file || request !== pickRequest.current || submitting.current) return;
      const problem = validateFile(file);
      if (problem) {
        setFileError(problem);
        fileShakeRef.current?.shake();
        haptics.error();
        return;
      }
      selectFile(file);
      setDetecting(true);
      const found = await detectPages(file, readPdfText);
      if (selectedFile.current !== file) return;
      setDetecting(false);
      if (found) {
        setSuggestion({ pages: found, sample: false });
        setForm((prev) => prev.file === file && prev.pages === '' ? { ...prev, pages: String(found) } : prev);
      }
    } catch {
      if (request === pickRequest.current) setFileError('Could not open that file. Try another one.');
    }
  };

  const useSample = () => {
    pickRequest.current += 1;
    const name = SAMPLE_FILES[Math.floor(Math.random() * SAMPLE_FILES.length)];
    const samplePages = 2 + Math.floor(Math.random() * 39);
    selectFile({ name, size: samplePages * 48 * 1024, mimeType: 'application/pdf', sample: true }, samplePages);
  };

  const removeFile = () => {
    pickRequest.current += 1;
    selectFile(null);
  };

  const stepCopies = (direction) => {
    setForm((prev) => {
      const current = positiveWholeNumber(prev.copies) || 1;
      const next = current + direction;
      const max = Math.max(0, Math.floor((prices.maxPages - pagesInBag) / ((positiveWholeNumber(prev.pages) || 1) * jobQuantity)));
      if (next < 1 || (direction > 0 && next > max)) return prev;
      return { ...prev, copies: String(next) };
    });
  };

  const buildItem = (key, documentReference) => {
    const binding = BINDINGS.find((option) => option.key === form.binding).label;
    const details = [
      `${pages} ${pages === 1 ? 'page' : 'pages'} per copy`,
      `${copies} ${copies === 1 ? 'copy' : 'copies'}`,
      form.color ? 'Color' : 'B&W',
      form.doubleSided ? 'Double-sided' : 'Single-sided',
      form.binding === 'none' ? 'No binding' : binding,
    ].join(' \u00b7 ');
    return {
      key,
      type: 'print',
      name: form.file.name,
      unitPrice: price.total,
      qty: 1,
      details,
      category: 'Printing',
      file: {
        fileName: form.file.name,
        fileSize: form.file.size,
        mimeType: form.file.mimeType,
        kind: fileKind(form.file),
        pages,
        ...documentReference,
        ...(form.file.sample ? { sample: true } : {}),
      },
      printOptions: { copies, color: form.color, doubleSided: form.doubleSided, binding: form.binding },
    };
  };

  const submit = async (replace = false) => {
    if (submitting.current || Object.keys(errors).length > 0) return;
    if (editing) {
      submitting.current = true;
      const issue = updatePrintJob(editKey, form);
      if (issue) {
        submitting.current = false;
        showToast({ message: issue, icon: 'alert-circle', tone: 'error' });
        return;
      }
      haptics.success();
      navigation.goBack();
      return;
    }
    if (!isStoreOpen(store, timeOffsetMs)) return;
    if (!replace && cart.items.length && cart.storeId !== 'printing') {
      setConflictVisible(true);
      return;
    }
    submitting.current = true;
    setSaving(true);
    setConflictVisible(false);
    const key = `print-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let documentReference;
    let added = false;
    try {
      documentReference = await savePrintDocument(form.file, key);
      const item = buildItem(key, documentReference);
      const result = replace ? replaceCart(item, 'printing') : addToCart(item, 'printing');
      if (result === 'closed') {
        setAvailabilityTick((tick) => tick + 1);
      } else if (result === 'print-limit') {
        showToast({ message: 'The order is limited to ' + prices.maxPages + ' printed pages across all jobs.', icon: 'alert-circle', tone: 'error' });
      } else if (result === 'conflict') {
        setConflictVisible(true);
      } else {
        added = true;
        showBagAddition({ scope: route.key, filename: item.name });
        pickRequest.current += 1;
        selectFile(null, null, true);
      }
    } catch {
      setFileError('Could not save this document for your print job. Choose it again and retry.');
    } finally {
      if (!added && documentReference) {
        await discardPrintDocument(documentReference).catch(() => {});
      }
      submitting.current = false;
      setSaving(false);
    }
  };

  const blockReason = !editing && !isOpen ? 'Printing Office is closed.'
    : errors.file || errors.pages || errors.copies || errors.limit || '';
  let pagesHint = '';
  if (detecting) pagesHint = 'Checking the page count\u2026';
  else if (!form.pages) pagesHint = 'Enter the number of pages in one copy.';
  else if (suggestion?.pages === pages) pagesHint = `${suggestion.sample ? 'Sample document' : 'Estimated page count'}: ${pages}. Check and adjust if needed.`;
  else if (suggestion) pagesHint = 'Page count edited by you.';
  const selectedKind = form.file
    ? FILE_KINDS[fileKind(form.file)] || { icon: 'document-outline', label: 'Document', tone: 'primary' }
    : null;

  if (editing && !editItem) {
    return (
      <EmptyState icon="print-outline" title="Print job unavailable" actionLabel="Back to bag" onAction={() => navigation.goBack()} />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <Animated.View style={[styles.flex, animatedStyle]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!editing && !isOpen ? (
            <View style={styles.closedCard}>
              <Ionicons name="moon-outline" size={20} color={colors.dangerText} />
              <Text style={styles.closedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {closedReason(store, campus.deliverySlots, timeOffsetMs)} — you can prepare your job now.
              </Text>
            </View>
          ) : null}

          <View>
            <SectionHeader title="1 · Document" style={styles.firstHeader} />
            <Card>
              <ShakeView ref={fileShakeRef}>
                {form.file ? (
                  <View style={styles.fileChip}>
                    <View style={[styles.fileIcon, { backgroundColor: colors[selectedKind.tone] }]}>
                      <Ionicons name={selectedKind.icon} size={22} color={colors.textOnDark} />
                      <Text style={styles.pdfText}>{selectedKind.label}</Text>
                    </View>
                    <View style={styles.fileText}>
                      <Text style={styles.fileName} numberOfLines={editing ? undefined : 1} ellipsizeMode="middle" maxFontSizeMultiplier={MAX_FONT_SCALE}>{form.file.name}</Text>
                      <Text style={styles.fileMeta} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                        {[selectedKind.label, formatFileSize(form.file.size)].filter(Boolean).join(' \u00b7 ')}
                      </Text>
                      {!editing ? <PressableScale onPress={pickFile} disabled={saving} hitSlop={8} style={styles.changeLink} accessibilityLabel={`Change file, currently ${form.file.name}`}>
                        <Text style={styles.changeText}>Change</Text>
                      </PressableScale> : null}
                    </View>
                    {!editing ? <PressableScale onPress={removeFile} disabled={saving} hitSlop={10} style={styles.removeButton} accessibilityLabel={`Remove ${form.file.name}`}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </PressableScale> : null}
                  </View>
                ) : (
                  <>
                    <PressableScale onPress={pickFile} disabled={saving} style={[styles.dropZone, fileError && styles.dropZoneError]} accessibilityLabel="Choose a file">
                      <Ionicons name="cloud-upload-outline" size={30} color={colors.primaryText} />
                      <Text style={styles.dropTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Choose a file</Text>
                      <Text style={styles.dropHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>PDF, Word or image · up to 25 MB</Text>
                    </PressableScale>
                    <PressableScale onPress={useSample} disabled={saving} hitSlop={8} style={styles.sampleLink} accessibilityLabel="Use a sample document">
                      <Text style={styles.changeText}>Use a sample document</Text>
                    </PressableScale>
                  </>
                )}
              </ShakeView>
              {fileError ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{fileError}</Text> : null}

              <AppInput
                label="Pages per copy"
                icon="documents-outline"
                keyboardType="number-pad"
                placeholder="e.g. 24"
                value={form.pages}
                onChangeText={(text) => {
                  setTouchedPages(true);
                  update('pages', text);
                }}
                onBlur={() => setTouchedPages(true)}
                editable={!saving}
                error={touchedPages ? errors.pages : undefined}
                style={styles.pagesInput}
              />
              {form.file && pagesHint ? (
                <Text style={styles.pagesHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>{pagesHint}</Text>
              ) : null}
            </Card>

            <SectionHeader title="2 · Options" />
            <Card>
              <SegmentedControl
                options={[
                  { value: 'bw', label: 'Black & White', subtitle: `${formatMoney(prices.bw)} / page` },
                  { value: 'color', label: 'Color', subtitle: `${formatMoney(prices.color)} / page` },
                ]}
                value={form.color ? 'color' : 'bw'}
                onChange={(value) => update('color', value === 'color')}
                disabled={saving}
              />

              <View style={[styles.switchRow, styles.divider]}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Double-sided</Text>
                  <Text style={[styles.switchHint, form.doubleSided && styles.savedHint]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {form.doubleSided ? 'Uses fewer sheets for multi-page copies. Same price.' : 'Print on both sides of the paper.'}
                  </Text>
                </View>
                <Switch
                  value={form.doubleSided}
                  disabled={saving}
                  onValueChange={(value) => updateAnimated('doubleSided', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Double-sided"
                />
              </View>

              <Text style={styles.bindingTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Binding (per copy)</Text>
              <SegmentedControl
                options={BINDINGS.map(({ key, label }) => ({
                  value: key,
                  label,
                  subtitle: formatMoney(prices.binding[key]),
                }))}
                value={form.binding}
                onChange={(value) => updateAnimated('binding', value)}
                disabled={saving}
              />
            </Card>

            <SectionHeader title="3 · Copies" />
            <Card>
              <View style={styles.copiesRow}>
                <View style={styles.copiesInfo}>
                  <Text style={styles.switchLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Number of copies</Text>
                  <Text style={styles.switchHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {pages} {pages === 1 ? 'page' : 'pages'} per copy
                  </Text>
                </View>
                <QuantitySelector
                  qty={copies}
                  allowRemove={false}
                  disabled={saving}
                  increaseDisabled={!canIncrease}
                  onIncrease={() => stepCopies(1)}
                  onDecrease={() => stepCopies(-1)}
                />
              </View>
              <Text style={[styles.progressText, overLimit && styles.limitError]} maxFontSizeMultiplier={MAX_FONT_SCALE}
                accessibilityLiveRegion="polite">
                {Number.isFinite(pagesInBag) ? printedPages + pagesInBag : prices.maxPages} / {prices.maxPages} printed pages in order
              </Text>
              <AnimatedProgressBar progress={Math.min(1, (printedPages + pagesInBag) / prices.maxPages)} color={overLimit ? colors.danger : colors.primary}
                height={6} style={styles.progress} />
              <Text style={styles.switchHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {sheets} physical {sheets === 1 ? 'sheet' : 'sheets'}
              </Text>
            </Card>
          </View>
        </ScrollView>
      </Animated.View>

      {!editing ? <BagAdditionNotice scope={route.key} focused={focused} onView={() => navigation.navigate('Cart')} /> : null}
      <StickyBar insetBottom={false} style={[styles.summaryBar, editing && { paddingBottom: insets.bottom + spacing.sm }]}>
        <PressableScale
          onPress={() => {
            animateLayout();
            setExpanded(!expanded);
          }}
          style={styles.breakdownToggle}
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? 'Hide price breakdown' : 'Show price breakdown'}
        >
          <Text style={styles.breakdownLine} numberOfLines={expanded ? 2 : 1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            Total
          </Text>
          <Animated.View style={{ transform: [{ scale: totalScale }] }}>
            <AnimatedNumber value={total} format={formatMoney} style={styles.totalValue} />
          </Animated.View>
          <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={18} color={colors.textMuted} />
        </PressableScale>

        {expanded ? (
          <View style={styles.breakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Printing · {printedPages} pages × {formatMoney(price.rate)}
              </Text>
              <Text style={styles.priceValue}>{formatMoney(price.printing * jobQuantity)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Binding · {formatMoney(price.bindingPrice)} × {copies * jobQuantity}
              </Text>
              <Text style={styles.priceValue}>{formatMoney(price.bindingTotal * jobQuantity)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Final total</Text>
              <Text style={styles.priceValue}>{formatMoney(total)}</Text>
            </View>
          </View>
        ) : null}

        <AppButton
          title={editing ? 'Save options' : 'Add to bag'}
          small
          icon={editing ? 'checkmark' : 'bag-add-outline'}
          onPress={() => submit()}
          loading={saving}
          disabled={!!blockReason}
          reason={blockReason}
        />
      </StickyBar>

      <ConfirmModal
        visible={conflictVisible}
        tone="warning"
        icon="swap-horizontal"
        title="Start a new bag?"
        message={`Your bag has items from ${getStore(cart.storeId)?.name || 'another store'}. Empty it and add this print job?`}
        confirmLabel="Empty & add"
        onConfirm={() => submit(true)}
        onCancel={() => setConflictVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}
