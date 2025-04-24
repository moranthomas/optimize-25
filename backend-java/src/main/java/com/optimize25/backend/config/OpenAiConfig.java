package com.optimize25.backend.config;

import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class OpenAiConfig {
    private static final Logger logger = LoggerFactory.getLogger(OpenAiConfig.class);
    
    @Value("${OPENAI_API_KEY:}")
    private String key;
    
    @Value("${OPENAI_API_URL:https://api.openai.com/v1/chat/completions}")
    private String url;
    
    public String getKey() {
        logger.debug("Getting API key from environment: {}", key.isEmpty() ? "NOT SET" : "SET");
        return key;
    }
    
    public void setKey(String key) {
        logger.debug("Setting API key: {}", key.isEmpty() ? "NOT SET" : "SET");
        this.key = key;
    }
    
    public String getUrl() {
        return url;
    }
    
    public void setUrl(String url) {
        this.url = url;
    }
} 