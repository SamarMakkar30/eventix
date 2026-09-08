package com.eventix.inventory.exception;

public class InventoryAlreadyInitializedException extends RuntimeException {
    public InventoryAlreadyInitializedException(String message) {
        super(message);
    }
}
