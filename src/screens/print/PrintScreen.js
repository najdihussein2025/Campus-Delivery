import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, ScrollView, StatusBar, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useApp } from '../../context/AppContext';
import AppButton from '../../components/AppButton';
import AppInput from '../../components/AppInput';
import Card from '../../components/Card';
import Chip from '../../components/Chip';
import ConfirmModal from '../../components/ConfirmModal';
import QuantitySelector from '../../components/QuantitySelector';
import SectionHeader from '../../components/SectionHeader';
import SegmentedControl from '../../components/SegmentedControl';
import StickyBar from '../../components/StickyBar';
import { AnimatedNumber, PressableScale, ShakeView, animateLayout, useScreenFocusAnimation, useToast } from '../../components/motion';
import { MAX_FONT_SCALE } from '../../theme/theme';
import { calcPrintPrice, formatMoney } from '../../utils/money';
import { closedReason, isStoreOpen } from '../../utils/time';
import { validatePrintJob } from '../../utils/validation';
import { PICKER_TYPES, detectPages, fileKind, formatFileSize, validateFile } from '../../utils/pdfPages';
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
const EMPTY_FORM = { docName: '', file: null, pages: '', copies: '1', color: false, doubleSided: false, binding: 'none' };

// Icon, label and colour token for each file type in the file chip
const FILE_KINDS = {
  pdf: { icon: 'document-text', label: 'PDF', tone: 'dangerSolid' },
  word: { icon: 'document', label: 'DOC', tone: 'primary' },
  image: { icon: 'image', label: 'IMG', tone: 'successSolid' },
};

// Reads a picked file as base64 (expo-file-system legacy API, the one that still has readAsStringAsync)
const readBase64 = (uri) => FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

// Print: controlled inputs, SegmentedControl/Switch/Chips and a live price that pulses when it changes
export default function PrintScreen({ navigation }) {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const { campus, cart, getStore, addToCart, replaceCart, timeOffsetMs, reduceMotion } = useApp();
  const { showToast } = useToast();
  const { animatedStyle } = useScreenFocusAnimation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [conflictVisible, setConflictVisible] = useState(false);
  const shakeRef = useRef(null);
  const fileShakeRef = useRef(null);
  const [fileError, setFileError] = useState('');
  const [detectedPages, setDetectedPages] = useState(null);
  // The page count the app filled in by itself (detected or sample); "edited by you" shows only after a change
  const [autoPages, setAutoPages] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const totalScale = useRef(new Animated.Value(1)).current;
  const totalFlash = useRef(new Animated.Value(0)).current;

  const store = getStore('printing');
  const isOpen = isStoreOpen(store, timeOffsetMs);
  const prices = campus.printPrices;
  const price = calcPrintPrice(form, prices);
  const errors = submitted ? validatePrintJob(form, prices.maxPages) : {};

  const pages = parseInt(form.pages, 10) || 0;
  const copies = parseInt(form.copies, 10) || 0;
  const printedPages = pages * copies;
  const overLimit = printedPages > prices.maxPages;
  const sheetsSaved = form.doubleSided ? pages * copies - Math.ceil(pages / 2) * copies : 0;

  // Highlight the total every time it changes (scale on native driver, colour flash on JS driver)
  useEffect(() => {
    if (reduceMotion || price.total === 0) return;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(totalScale, { toValue: 1.06, duration: 120, useNativeDriver: true }),
        Animated.spring(totalScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(totalFlash, { toValue: 1, duration: 120, useNativeDriver: false }),
        Animated.timing(totalFlash, { toValue: 0, duration: 380, useNativeDriver: false }),
      ]),
    ]).start();
  }, [price.total]);

  const totalColor = totalFlash.interpolate({ inputRange: [0, 1], outputRange: [colors.text, colors.primaryText] });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateAnimated = (field, value) => {
    animateLayout();
    update(field, value);
  };

  // Real file pick: validates type and size, then tries to detect the page count (never blocks)
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: PICKER_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets || !result.assets.length) {
        showToast({ message: 'No file selected', icon: 'document-outline' });
        return;
      }
      const asset = result.assets[0];
      const file = { name: asset.name, size: asset.size, mimeType: asset.mimeType, uri: asset.uri };
      const problem = validateFile(file);
      if (problem) {
        setFileError(problem);
        showToast({ message: problem, icon: 'alert-circle', tone: 'error' });
        fileShakeRef.current?.shake();
        haptics.error();
        return;
      }
      setFileError('');
      animateLayout();
      setDetectedPages(null);
      setAutoPages(null);
      setForm((prev) => ({ ...prev, docName: file.name, file, pages: '' }));
      setDetecting(true);
      const found = await detectPages(file, readBase64);
      setDetecting(false);
      if (found) {
        setDetectedPages(found);
        setAutoPages(found);
        // Only fill the field if the student has not typed a number in the meantime
        setForm((prev) => (prev.file && prev.file.uri === file.uri && prev.pages === '' ? { ...prev, pages: String(found) } : prev));
      }
    } catch (error) {
      console.log('File pick failed', error.message);
      setDetecting(false);
      setFileError('Could not open that file. Try another one.');
      showToast({ message: 'Could not open that file. Try another one.', icon: 'alert-circle', tone: 'error' });
    }
  };

  // Demo fallback: pretend a file was picked
  const useSample = () => {
    const name = SAMPLE_FILES[Math.floor(Math.random() * SAMPLE_FILES.length)];
    const randomPages = 2 + Math.floor(Math.random() * 39);
    animateLayout();
    setFileError('');
    setDetectedPages(null);
    setAutoPages(randomPages);
    setForm((prev) => ({
      ...prev,
      docName: name,
      file: { name, size: randomPages * 48 * 1024, mimeType: 'application/pdf', uri: null },
      pages: String(randomPages),
    }));
  };

  const removeFile = () => {
    animateLayout();
    setFileError('');
    setDetectedPages(null);
    setAutoPages(null);
    setDetecting(false);
    setForm((prev) => ({ ...prev, docName: '', file: null, pages: '' }));
  };

  const bindingLabel = (key) => {
    const extra = prices.binding[key];
    return extra ? `${BINDINGS.find((b) => b.key === key).label} +${formatMoney(extra)}` : 'None';
  };

  const buildItem = () => {
    const details = [
      `${pages} pages`,
      `${copies} ${copies === 1 ? 'copy' : 'copies'}`,
      form.color ? 'Color' : 'B&W',
      form.doubleSided ? 'Double-sided' : null,
      form.binding !== 'none' ? BINDINGS.find((b) => b.key === form.binding).label : null,
    ]
      .filter(Boolean)
      .join(' · ');
    return {
      key: `print-${Date.now()}`,
      type: 'print',
      name: form.docName.trim(),
      unitPrice: price.total,
      qty: 1,
      details,
      category: 'Printing',
      // Only these four fields are kept: the file itself is never uploaded
      file: form.file
        ? { fileName: form.file.name, fileSize: form.file.size, mimeType: form.file.mimeType, pages }
        : null,
    };
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFileError('');
    setDetectedPages(null);
    setAutoPages(null);
    setSubmitted(false);
  };

  const confirmAdded = () => {
    showToast({
      message: `${form.docName} added to bag`,
      icon: 'print',
      tone: 'success',
      actionLabel: 'View',
      onAction: () => navigation.navigate('Cart'),
    });
    resetForm();
  };

  const handleAdd = () => {
    setSubmitted(true);
    const found = validatePrintJob(form, prices.maxPages);
    if (Object.keys(found).length > 0) {
      shakeRef.current?.shake();
      return;
    }
    const result = addToCart(buildItem(), 'printing');
    if (result === 'conflict') setConflictVisible(true);
    else if (result === 'closed') showToast({ message: 'UA is closed – ordering is paused', icon: 'moon', tone: 'error' });
    else confirmAdded();
  };

  const handleReplace = () => {
    replaceCart(buildItem(), 'printing');
    setConflictVisible(false);
    confirmAdded();
  };

  let blockReason = '';
  if (!isOpen) blockReason = closedReason(store, campus.deliverySlots, timeOffsetMs);
  else if (overLimit) blockReason = `Max ${prices.maxPages} printed pages per order (you have ${printedPages})`;

  // Hint under the page field: "edited by you" only after the student changed the auto-filled number
  let pagesHint = '';
  if (detecting) pagesHint = 'Checking the page count…';
  else if (!form.pages) pagesHint = 'Enter the number of pages';
  else if (autoPages && Number(form.pages) === autoPages) {
    pagesHint = `${detectedPages ? 'Detected' : 'Sample document:'} ${autoPages} ${autoPages === 1 ? 'page' : 'pages'} · edit if wrong`;
  } else if (autoPages) pagesHint = 'Page count edited by you';

  const bindingText = form.binding !== 'none' ? ` + ${form.binding} ${formatMoney(price.bindingTotal)}` : '';
  const summaryLine = `${pages} pages × ${copies} ${copies === 1 ? 'copy' : 'copies'} × ${formatMoney(price.rate)}${bindingText}`;

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={colors.headerBg} />
      <Animated.View style={[styles.flex, animatedStyle]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {!isOpen ? (
            <View style={styles.closedCard}>
              <Ionicons name="moon-outline" size={20} color={colors.dangerText} />
              <Text style={styles.closedText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {closedReason(store, campus.deliverySlots, timeOffsetMs)} — you can prepare your job now.
              </Text>
            </View>
          ) : null}

          <ShakeView ref={shakeRef}>
            <SectionHeader title="1 · Document" style={styles.firstHeader} />
            <Card>
              <ShakeView ref={fileShakeRef}>
                {form.file ? (
                  <View style={styles.fileChip}>
                    <View style={[styles.fileIcon, { backgroundColor: colors[FILE_KINDS[fileKind(form.file) || 'pdf'].tone] }]}>
                      <Ionicons name={FILE_KINDS[fileKind(form.file) || 'pdf'].icon} size={22} color={colors.textOnDark} />
                      <Text style={styles.pdfText}>{FILE_KINDS[fileKind(form.file) || 'pdf'].label}</Text>
                    </View>
                    <View style={styles.fileText}>
                      <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle" maxFontSizeMultiplier={MAX_FONT_SCALE}>{form.file.name}</Text>
                      <Text style={styles.fileMeta} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                        {[formatFileSize(form.file.size), detectedPages ? `${detectedPages} ${detectedPages === 1 ? 'page' : 'pages'}` : null]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      <PressableScale onPress={pickFile} hitSlop={8} style={styles.changeLink} accessibilityLabel={`Change file, currently ${form.file.name}`}>
                        <Text style={styles.changeText}>Change</Text>
                      </PressableScale>
                    </View>
                    <PressableScale onPress={removeFile} hitSlop={10} style={styles.removeButton} accessibilityLabel={`Remove ${form.file.name}`}>
                      <Ionicons name="close" size={20} color={colors.textMuted} />
                    </PressableScale>
                  </View>
                ) : (
                  <>
                    <PressableScale onPress={pickFile} style={[styles.dropZone, (errors.docName || fileError) && styles.dropZoneError]} accessibilityLabel="Choose a file">
                      <Ionicons name="cloud-upload-outline" size={30} color={colors.primaryText} />
                      <Text style={styles.dropTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Choose a file</Text>
                      <Text style={styles.dropHint} maxFontSizeMultiplier={MAX_FONT_SCALE}>PDF, Word or image · up to 25 MB</Text>
                    </PressableScale>
                    <PressableScale onPress={useSample} hitSlop={8} style={styles.sampleLink} accessibilityLabel="Use a sample document">
                      <Text style={styles.changeText}>Use a sample document</Text>
                    </PressableScale>
                  </>
                )}
              </ShakeView>
              {fileError ? <Text style={styles.errorText} accessibilityLiveRegion="polite">{fileError}</Text> : null}
              {errors.docName && !fileError ? <Text style={styles.errorText}>Choose a document to print</Text> : null}

              <AppInput
                label="Pages to print"
                icon="documents-outline"
                keyboardType="number-pad"
                placeholder="e.g. 24"
                value={form.pages}
                onChangeText={(text) => update('pages', text.replace(/[^0-9]/g, ''))}
                error={errors.pages}
                maxLength={3}
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
                  { value: 'bw', label: 'B&W', subtitle: `${formatMoney(prices.bw)} / page` },
                  { value: 'color', label: 'Color', subtitle: `${formatMoney(prices.color)} / page` },
                ]}
                value={form.color ? 'color' : 'bw'}
                onChange={(value) => update('color', value === 'color')}
              />

              <View style={[styles.switchRow, styles.divider]}>
                <View style={styles.switchText}>
                  <Text style={styles.switchLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Double-sided</Text>
                  <Text style={[styles.switchHint, form.doubleSided && styles.savedHint]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    {form.doubleSided ? `Saves ${sheetsSaved} sheets · same price` : 'Print on both sides of the paper'}
                  </Text>
                </View>
                <Switch
                  value={form.doubleSided}
                  onValueChange={(value) => updateAnimated('doubleSided', value)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Double-sided"
                />
              </View>

              <Text style={styles.bindingTitle} maxFontSizeMultiplier={MAX_FONT_SCALE}>Binding (per copy)</Text>
              <FlatList
                data={BINDINGS}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                  <Chip label={bindingLabel(item.key)} selected={form.binding === item.key} onPress={() => updateAnimated('binding', item.key)} />
                )}
              />
            </Card>

            <SectionHeader title="3 · Copies" />
            <Card style={styles.copiesCard}>
              <View style={styles.copiesInfo}>
                <Text style={styles.switchLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>Number of copies</Text>
                <Text style={[styles.switchHint, overLimit && styles.limitError]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  {pages} pages × {copies || 1} {copies === 1 ? 'copy' : 'copies'} = {printedPages} of {prices.maxPages} max printed pages
                </Text>
              </View>
              <QuantitySelector
                qty={copies || 1}
                allowRemove={false}
                onIncrease={() => update('copies', String((copies || 1) + 1))}
                onDecrease={() => update('copies', String(Math.max(1, (copies || 1) - 1)))}
              />
            </Card>
            {errors.copies ? <Text style={styles.errorText}>{errors.copies}</Text> : null}

            {overLimit ? (
              <View style={styles.limitCard}>
                <Ionicons name="alert-circle" size={18} color={colors.dangerText} />
                <Text style={styles.limitText} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                  Max {prices.maxPages} printed pages per order (you have {printedPages})
                </Text>
              </View>
            ) : null}
          </ShakeView>
        </ScrollView>
      </Animated.View>

      <StickyBar>
        <PressableScale
          onPress={() => {
            animateLayout();
            setExpanded(!expanded);
          }}
          style={styles.breakdownToggle}
          accessibilityLabel={expanded ? 'Hide price breakdown' : 'Show price breakdown'}
        >
          <Text style={styles.breakdownLine} numberOfLines={expanded ? 2 : 1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
            {summaryLine}
          </Text>
          <Animated.View style={{ transform: [{ scale: totalScale }] }}>
            <AnimatedNumber value={price.total} format={formatMoney} style={styles.totalValue} />
          </Animated.View>
          <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={18} color={colors.textMuted} />
        </PressableScale>

        {expanded ? (
          <View style={styles.breakdown}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Printing · {printedPages} pages × {formatMoney(price.rate)}
              </Text>
              <Text style={styles.priceValue}>{formatMoney(price.printing)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Binding · {formatMoney(price.bindingPrice)} × {copies}
              </Text>
              <Text style={styles.priceValue}>{formatMoney(price.bindingTotal)}</Text>
            </View>
          </View>
        ) : null}

        <AppButton
          title={`Add to bag · ${formatMoney(price.total)}`}
          icon="bag-add-outline"
          onPress={handleAdd}
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
        onConfirm={handleReplace}
        onCancel={() => setConflictVisible(false)}
      />
    </View>
  );
}
