import SwiftUI

struct CalendarPickerView: View {
    @Binding var selectedDate: Date
    @Binding var isPresented: Bool
    let onDateSelected: (Date) -> Void
    
    @State private var displayedMonth = Date()
    private let calendar = Calendar.current
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // 월 네비게이션
                monthNavigationView
                    .padding()
                
                // 요일 헤더
                weekdayHeaderView
                    .padding(.horizontal)
                
                // 날짜 그리드
                monthGridView
                    .padding(.horizontal)
                
                Spacer()
                
                // 오늘 버튼
                todayButton
                    .padding()
            }
            .navigationTitle("날짜 선택")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("닫기") {
                        isPresented = false
                    }
                }
            }
        }
    }
    
    // MARK: - Month Navigation
    private var monthNavigationView: some View {
        HStack {
            Button(action: previousMonth) {
                Image(systemName: "chevron.left")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            Spacer()
            
            Text(monthYearString)
                .font(.title2)
                .fontWeight(.semibold)
            
            Spacer()
            
            Button(action: nextMonth) {
                Image(systemName: "chevron.right")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
        }
    }
    
    // MARK: - Weekday Header
    private var weekdayHeaderView: some View {
        HStack {
            ForEach(weekdaySymbols, id: \.self) { symbol in
                Text(symbol)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.secondary)
                    .frame(maxWidth: .infinity)
            }
        }
    }
    
    // MARK: - Month Grid
    private var monthGridView: some View {
        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 10) {
            ForEach(daysInMonth, id: \.self) { date in
                if let date = date {
                    dayView(for: date)
                } else {
                    Color.clear
                        .frame(height: 40)
                }
            }
        }
    }
    
    // MARK: - Day View
    private func dayView(for date: Date) -> some View {
        let isSelected = calendar.isDate(date, inSameDayAs: selectedDate)
        let isToday = calendar.isDate(date, inSameDayAs: Date())
        let isCurrentMonth = calendar.isDate(date, equalTo: displayedMonth, toGranularity: .month)
        
        return Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                selectedDate = date
                onDateSelected(date)
                
                // 선택 후 0.3초 뒤에 닫기
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    isPresented = false
                }
            }
        }) {
            Text("\(calendar.component(.day, from: date))")
                .font(.system(size: 16))
                .fontWeight(isSelected ? .bold : .regular)
                .foregroundColor(foregroundColor(isSelected: isSelected, isToday: isToday, isCurrentMonth: isCurrentMonth))
                .frame(width: 40, height: 40)
                .background(
                    Circle()
                        .fill(backgroundColor(isSelected: isSelected, isToday: isToday))
                )
                .overlay(
                    Circle()
                        .stroke(isToday && !isSelected ? Color.blue : Color.clear, lineWidth: 2)
                )
        }
        .disabled(!isCurrentMonth)
    }
    
    // MARK: - Today Button
    private var todayButton: some View {
        Button(action: {
            withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                selectedDate = Date()
                displayedMonth = Date()
                onDateSelected(Date())
                
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                    isPresented = false
                }
            }
        }) {
            Text("오늘")
                .font(.headline)
                .foregroundColor(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.blue)
                .cornerRadius(10)
        }
    }
    
    // MARK: - Helper Methods
    private func previousMonth() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            displayedMonth = calendar.date(byAdding: .month, value: -1, to: displayedMonth) ?? displayedMonth
        }
    }
    
    private func nextMonth() {
        withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
            displayedMonth = calendar.date(byAdding: .month, value: 1, to: displayedMonth) ?? displayedMonth
        }
    }
    
    private var monthYearString: String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        formatter.dateFormat = "yyyy년 M월"
        return formatter.string(from: displayedMonth)
    }
    
    private var weekdaySymbols: [String] {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "ko_KR")
        return ["일", "월", "화", "수", "목", "금", "토"]
    }
    
    private var daysInMonth: [Date?] {
        guard let monthRange = calendar.range(of: .day, in: .month, for: displayedMonth),
              let firstOfMonth = calendar.date(from: calendar.dateComponents([.year, .month], from: displayedMonth)) else {
            return []
        }
        
        let firstWeekday = calendar.component(.weekday, from: firstOfMonth) - 1
        var days: [Date?] = Array(repeating: nil, count: firstWeekday)
        
        for day in monthRange {
            if let date = calendar.date(byAdding: .day, value: day - 1, to: firstOfMonth) {
                days.append(date)
            }
        }
        
        // 6주(42일)가 되도록 채우기
        while days.count < 42 {
            days.append(nil)
        }
        
        return days
    }
    
    private func foregroundColor(isSelected: Bool, isToday: Bool, isCurrentMonth: Bool) -> Color {
        if isSelected {
            return .white
        } else if !isCurrentMonth {
            return .gray.opacity(0.3)
        } else if isToday {
            return .blue
        } else {
            return .primary
        }
    }
    
    private func backgroundColor(isSelected: Bool, isToday: Bool) -> Color {
        if isSelected {
            return .blue
        } else {
            return .clear
        }
    }
}

struct CalendarPickerView_Previews: PreviewProvider {
    static var previews: some View {
        CalendarPickerView(
            selectedDate: .constant(Date()),
            isPresented: .constant(true),
            onDateSelected: { _ in }
        )
    }
}