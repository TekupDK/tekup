/**
 * 🤖 AI Friday Widget
 *
 * Floating AI assistant widget with chat functionality
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIFridayWidgetProps {
  context?: 'employee' | 'manager' | 'customer';
}

export const AIFridayWidget: React.FC<AIFridayWidgetProps> = ({ context = 'employee' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hej! Jeg er Friday, din AI assistent. Hvordan kan jeg hjælpe dig i dag?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOpen(true);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(false);
  };

  const handleSend = () => {
    if (!message.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Jeg arbejder på dit spørgsmål. Dette er en demo response!',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleOpen}
        activeOpacity={0.9}
      >
        <View style={styles.avatarGradient}>
          <Ionicons name="star" size={24} color="#ffffff" />
        </View>
        <View style={styles.pulseRing} />
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <BlurView intensity={20} style={styles.blurBackground} tint="dark">
            <View style={styles.chatContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.fridayAvatar}>
                    <Ionicons name="star" size={20} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>AI Friday</Text>
                    <View style={styles.statusRow}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.headerSubtitle}>Altid tilgængelig</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.neutral[700]} />
                </TouchableOpacity>
              </View>

              {/* Messages */}
              <ScrollView
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
              >
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageBubble,
                      msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        msg.sender === 'user' ? styles.userText : styles.aiText,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              {/* Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Stil et spørgsmål..."
                  placeholderTextColor={colors.neutral[400]}
                  value={message}
                  onChangeText={setMessage}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={!message.trim()}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={message.trim() ? '#ffffff' : colors.neutral[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },

  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },

  pulseRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.primary[300],
    opacity: 0.5,
  },

  modalContainer: {
    flex: 1,
  },

  blurBackground: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  chatContainer: {
    height: '80%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  fridayAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },

  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: colors.neutral[900],
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success[500],
    marginRight: spacing.xs,
  },

  headerSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.neutral[600],
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },

  messagesContainer: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  messagesContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.xl,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary[500],
  },

  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    ...shadows.sm,
  },

  messageText: {
    fontSize: typography.sizes.base,
    lineHeight: typography.lineHeights.relaxed * typography.sizes.base,
  },

  userText: {
    color: '#ffffff',
  },

  aiText: {
    color: colors.neutral[900],
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: spacing.md,
  },

  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.neutral[50],
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.neutral[900],
  },

  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },

  sendButtonDisabled: {
    backgroundColor: colors.neutral[200],
  },
});
