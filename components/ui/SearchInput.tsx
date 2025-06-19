import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ViewStyle,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';
import { ThemedText } from '../ThemedText';
import { useTheme } from '../../contexts/ThemeContext';

interface SearchInputProps {
  value?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  showHistory?: boolean;
  searchHistory?: string[];
  onHistorySelect?: (query: string) => void;
  onClearHistory?: () => void;
  autoFocus?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
  maxLength?: number;
}

export function SearchInput({
  value = '',
  placeholder = 'Search movies...',
  onSearch,
  onClear,
  debounceMs = 300,
  showHistory = true,
  searchHistory = [],
  onHistorySelect,
  onClearHistory,
  autoFocus = false,
  style,
  disabled = false,
  maxLength = 100,
}: SearchInputProps) {
  const { colors } = useTheme();
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<TextInput>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      onSearch?.(query);
    }, debounceMs),
    [onSearch, debounceMs]
  );

  // Handle input change
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    debouncedSearch(text);
  }, [debouncedSearch]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (searchHistory.length > 0 && !inputValue) {
      setShowSuggestions(true);
    }
    
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, searchHistory.length, inputValue]);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setTimeout(() => setShowSuggestions(false), 150); // Delay to allow suggestion tap
    
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [animatedValue]);

  // Handle clear
  const handleClear = useCallback(() => {
    setInputValue('');
    setShowSuggestions(false);
    onClear?.();
    inputRef.current?.focus();
  }, [onClear]);

  // Handle history item select
  const handleHistorySelect = useCallback((query: string) => {
    setInputValue(query);
    setShowSuggestions(false);
    onHistorySelect?.(query);
    Keyboard.dismiss();
  }, [onHistorySelect]);

  // Filter search history based on current input
  const filteredHistory = searchHistory.filter(item =>
    item.toLowerCase().includes(inputValue.toLowerCase()) && item !== inputValue
  );

  // Animated border color
  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Render search history item
  const renderHistoryItem = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistorySelect(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="time-outline" size={16} color="#666666" />
      <ThemedText style={styles.historyText} numberOfLines={1}>
        {item}
      </ThemedText>
      <Ionicons name="arrow-up-outline" size={16} color="#666666" />
    </TouchableOpacity>
  ), [handleHistorySelect]);

  return (
    <View style={[styles.container, style]}>
      {/* Search Input */}
      <Animated.View style={[styles.inputContainer, { borderColor }]}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isFocused ? colors.primary : colors.textSecondary} 
          style={styles.searchIcon}
        />
        
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputValue}
          onChangeText={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          maxLength={maxLength}
          editable={!disabled}
          selectTextOnFocus={true}
          clearButtonMode={Platform.OS === 'ios' ? 'while-editing' : 'never'}
          onSubmitEditing={() => {
            if (inputValue.trim()) {
              onSearch?.(inputValue.trim());
              Keyboard.dismiss();
            }
          }}
        />

        {/* Clear button for Android */}
        {Platform.OS === 'android' && inputValue.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={20} color="#666666" />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Search History/Suggestions */}
      {showHistory && showSuggestions && filteredHistory.length > 0 && (
        <View style={[styles.suggestionsContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.suggestionsHeader}>
            <ThemedText style={styles.suggestionsTitle}>
              Recent Searches
            </ThemedText>
            {onClearHistory && (
              <TouchableOpacity
                onPress={onClearHistory}
                activeOpacity={0.7}
                style={styles.clearHistoryButton}
              >
                <ThemedText style={styles.clearHistoryText}>
                  Clear
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={filteredHistory.slice(0, 5)} // Show max 5 suggestions
            renderItem={renderHistoryItem}
            keyExtractor={(item, index) => `${item}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 0, // Remove default padding
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    maxHeight: 250,
    zIndex: 1001,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  clearHistoryButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  suggestionsList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
    marginLeft: 12,
    marginRight: 8,
  },
});

export default SearchInput; 