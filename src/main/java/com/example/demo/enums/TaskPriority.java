package com.example.demo.enums;
public enum TaskPriority {
    LOW("Düşük", "#28a745"),      // Yeşil
    MEDIUM("Orta", "#ffc107"),    // Sarı  
    HIGH("Yüksek", "#fd7e14"),    // Turuncu
    URGENT("Acil", "#dc3545");    // Kırmızı
   
    private final String displayName;
    private final String color;
   
    TaskPriority(String displayName, String color) {
        this.displayName = displayName;
        this.color = color;
    }
   
    public String getDisplayName() {
        return displayName;
    }
   
    public String getColor() {
        return color;
    }
}