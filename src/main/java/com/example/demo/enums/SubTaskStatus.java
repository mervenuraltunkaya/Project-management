package com.example.demo.enums;

public enum SubTaskStatus {
    TODO("Yapılacak"),
    IN_PROGRESS("Devam Ediyor"),
    DONE("Tamamlandı");
   
    private final String displayName;
   
    SubTaskStatus(String displayName) {
        this.displayName = displayName;
    }
   
    public String getDisplayName() {
        return displayName;
    }
}
