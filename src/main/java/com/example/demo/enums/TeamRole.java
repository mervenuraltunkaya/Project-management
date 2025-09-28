package com.example.demo.enums;

public enum TeamRole {
    MEMBER("Üye"),
    TEAM_LEAD("Takım Lideri");

    private final String displayName;

    TeamRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
