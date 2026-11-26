import React, { useCallback } from 'react';
import { FlatList, View } from 'react-native';

// These small chip lists are fully rendered and let the parent screen handle scrolling.
export default function WrappedFlatList({ data, renderItem, keyExtractor, wrapStyle, extraData }) {
  const renderWrap = useCallback(({ children, onLayout }) => (
    <View style={wrapStyle} onLayout={onLayout}>{children}</View>
  ), [wrapStyle]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      extraData={extraData}
      scrollEnabled={false}
      initialNumToRender={data.length}
      removeClippedSubviews={false}
      renderScrollComponent={renderWrap}
    />
  );
}
