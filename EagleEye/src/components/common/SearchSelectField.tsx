import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  FlatList,
  ViewStyle,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { useDebounce } from '@/hooks/useDebounce';

export interface SearchResultItem {
  id: string | number;
  title: string;
  subtitle?: string;
  extra?: string;
  raw?: any;
}

interface SearchSelectFieldProps {
  label: string;
  placeholder: string;
  initialPromptText?: string;
  selectedText?: string;
  selectedId?: string | number | null;
  onSelect: (item: SearchResultItem | null) => void;
  onSearch: (query: string) => Promise<SearchResultItem[]>;
  onAddNew?: () => void;
  addButtonLabel?: string;
  emptyMessage?: string;
  required?: boolean;
  icon?: string;
  style?: ViewStyle;
}

export const SearchSelectField: React.FC<SearchSelectFieldProps> = ({
  label,
  placeholder,
  initialPromptText = 'Type to search',
  selectedText = '',
  selectedId = null,
  onSelect,
  onSearch,
  onAddNew,
  addButtonLabel = '+ Add New',
  emptyMessage = 'No matching records found',
  required = false,
  icon = '🔍',
  style,
}) => {
  const [inputText, setInputText] = useState<string>(selectedText);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const debouncedQuery = useDebounce(inputText, 350);

  // Sync selected text when prop changes externally
  useEffect(() => {
    if (selectedText) {
      setInputText(selectedText);
    } else if (!selectedId) {
      setInputText('');
    }
  }, [selectedText, selectedId]);

  // Execute search when debounced query updates
  useEffect(() => {
    let isCurrent = true;

    const performSearch = async () => {
      const q = debouncedQuery.trim();
      if (q.length < 2) {
        setResults([]);
        setLoading(false);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);

      try {
        const items = await onSearch(q);
        if (isCurrent) {
          setResults(items);
          setHasSearched(true);
        }
      } catch {
        if (isCurrent) {
          setResults([]);
          setHasSearched(true);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    };

    performSearch();

    return () => {
      isCurrent = false;
    };
  }, [debouncedQuery, onSearch]);

  const handleSelectItem = (item: SearchResultItem) => {
    setInputText(item.title);
    setIsOpen(false);
    Keyboard.dismiss();
    onSelect(item);
  };

  const handleClear = () => {
    setInputText('');
    setResults([]);
    setIsOpen(false);
    setHasSearched(false);
    onSelect(null);
  };

  const handleAddNewPress = () => {
    setIsOpen(false);
    Keyboard.dismiss();
    if (onAddNew) {
      onAddNew();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Label Row */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </View>

      {/* Input Box */}
      <View style={[styles.inputWrapper, isOpen && styles.focusedInput]}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            if (!text.trim()) {
              setResults([]);
              setIsOpen(false);
              setHasSearched(false);
              onSelect(null);
            } else {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (inputText.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
        />

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.accentOrange} style={{ marginLeft: 8 }} />
        ) : inputText ? (
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Helper text before typing */}
      {!isOpen && !selectedId && !inputText && (
        <Text style={styles.initialPromptHint}>{initialPromptText}</Text>
      )}

      {/* Selected Verified Badge */}
      {selectedId && !isOpen && (
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>✓ Selected: {inputText} (ID: {selectedId})</Text>
        </View>
      )}

      {/* Search Results Dropdown Overlay */}
      {isOpen && inputText.trim().length >= 2 && (
        <View style={styles.dropdownContainer}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={COLORS.accentOrange} />
              <Text style={styles.loadingText}>Searching records...</Text>
            </View>
          ) : results.length > 0 ? (
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              style={{ maxHeight: 220 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultCard}
                  activeOpacity={0.7}
                  onPress={() => handleSelectItem(item)}
                >
                  <View style={styles.resultMain}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    {item.subtitle ? <Text style={styles.resultSubtitle}>{item.subtitle}</Text> : null}
                    {item.extra ? <Text style={styles.resultExtra}>{item.extra}</Text> : null}
                  </View>
                  <Text style={styles.selectArrow}>Select ➔</Text>
                </TouchableOpacity>
              )}
            />
          ) : hasSearched ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{emptyMessage}</Text>
              {onAddNew && (
                <TouchableOpacity style={styles.addBtn} onPress={handleAddNewPress}>
                  <Text style={styles.addBtnText}>{addButtonLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  requiredAsterisk: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    paddingHorizontal: 14,
    height: 46,
  },
  focusedInput: {
    borderColor: COLORS.primary,
    backgroundColor: '#1E1E24',
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: {
    padding: 6,
  },
  clearBtnText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  initialPromptHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  selectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  selectedBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownContainer: {
    backgroundColor: '#111111',
    borderRadius: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  resultMain: {
    flex: 1,
    marginRight: 10,
  },
  resultTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  resultSubtitle: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  resultExtra: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  selectArrow: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 10,
    textAlign: 'center',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
