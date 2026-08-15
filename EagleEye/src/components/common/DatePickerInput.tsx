import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { COLORS } from '@/theme/colors';
import { formatDate } from '@/utils/dateFormatter';

interface DatePickerInputProps {
  label: string;
  value: string;
  onChangeDate: (formattedDate: string) => void;
  icon?: string;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
  placeholder?: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChangeDate,
  icon = '📅',
  required = false,
  minYear = 1950,
  maxYear = 2035,
  placeholder = 'Select Date',
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Initialize selected values from existing value or default to current date
  const now = new Date();
  const [selectedDay, setSelectedDay] = useState<number>(now.getDate());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const formattedDisplay = value ? formatDate(value) : '';

  const handleOpenPicker = () => {
    // Attempt to parse existing value
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setSelectedDay(d.getDate());
        setSelectedMonth(d.getMonth());
        setSelectedYear(d.getFullYear());
      }
    }
    setModalVisible(true);
  };

  const handleConfirm = () => {
    const padDay = selectedDay.toString().padStart(2, '0');
    const monthStr = MONTHS[selectedMonth];
    const dateString = `${padDay} ${monthStr} ${selectedYear}`;
    onChangeDate(dateString);
    setModalVisible(false);
  };

  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const days: number[] = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {required && <Text style={styles.requiredAsterisk}> *</Text>}
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleOpenPicker}
        style={[styles.inputWrapper, formattedDisplay ? styles.inputFilled : null]}
      >
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.valueText, !formattedDisplay && styles.placeholderText]}>
          {formattedDisplay || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Date Selection Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select {label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Column Pickers */}
            <View style={styles.columnsContainer}>
              {/* Day Column */}
              <View style={styles.columnWrapper}>
                <Text style={styles.columnHeader}>Day</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {days.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.optionItem, selectedDay === d && styles.optionSelected]}
                      onPress={() => setSelectedDay(d)}
                    >
                      <Text style={[styles.optionText, selectedDay === d && styles.optionTextSelected]}>
                        {d.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Column */}
              <View style={styles.columnWrapper}>
                <Text style={styles.columnHeader}>Month</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {MONTHS.map((m, idx) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.optionItem, selectedMonth === idx && styles.optionSelected]}
                      onPress={() => setSelectedMonth(idx)}
                    >
                      <Text style={[styles.optionText, selectedMonth === idx && styles.optionTextSelected]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Column */}
              <View style={styles.columnWrapper}>
                <Text style={styles.columnHeader}>Year</Text>
                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {years.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.optionItem, selectedYear === y && styles.optionSelected]}
                      onPress={() => setSelectedYear(y)}
                    >
                      <Text style={[styles.optionText, selectedYear === y && styles.optionTextSelected]}>
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Action CTAs */}
            <View style={styles.pickerActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>Set Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
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
    letterSpacing: 0.5,
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
    minHeight: 50,
  },
  inputFilled: {
    borderColor: COLORS.primaryGlow,
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  valueText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  placeholderText: {
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  dropdownArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  pickerCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1.5,
    borderTopColor: COLORS.surfaceBorder,
    maxHeight: 400,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  pickerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    color: COLORS.textMuted,
    fontSize: 20,
    fontWeight: 'bold',
    padding: 4,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 180,
    marginBottom: 16,
  },
  columnWrapper: {
    flex: 1,
    marginHorizontal: 4,
  },
  columnHeader: {
    color: COLORS.accentOrange,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  columnScroll: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  optionItem: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  optionSelected: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  optionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: '800',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cancelBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
  },
});
