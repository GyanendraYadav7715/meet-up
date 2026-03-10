package com.gyan.entertainment.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message, Long id) {
        super(message);
    }
}
