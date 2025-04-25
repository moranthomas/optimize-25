package com.optimize25.backend.controller;

import org.springframework.web.bind.annotation.*;
import com.optimize25.backend.service.ChatGPTService;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/chatgpt")
@CrossOrigin(origins = "http://localhost:3000")
public class ChatGPTController {

    private final ChatGPTService chatGPTService;

    @Autowired
    public ChatGPTController(ChatGPTService chatGPTService) {
        this.chatGPTService = chatGPTService;
    }

    @PostMapping("/populate/physical")
    public ResponseEntity<String> populateOptimizePhysical() {
        try {
            chatGPTService.populateOptimizePhysical();
            return ResponseEntity.ok("Successfully populated Optimize Physical content");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to populate content: " + e.getMessage());
        }
    }

    @PostMapping("/populate/{nodeName}")
    public ResponseEntity<Void> populateNode(@PathVariable String nodeName) {
        try {
            // Decode the URL-encoded node name
            String decodedNodeName = java.net.URLDecoder.decode(nodeName, "UTF-8");
            chatGPTService.populateNode(decodedNodeName);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
} 