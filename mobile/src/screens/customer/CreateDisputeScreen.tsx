import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { CustomerStackParamList } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type RouteType = RouteProp<CustomerStackParamList, 'CreateDispute'>;
type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const CreateDisputeScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const navigation = useNavigation<NavProp>();
  const { agreementId, chargeId } = route.params;

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!subject.trim() || !description.trim()) {
      Alert.alert('Error', 'Please fill in both subject and description');
      return;
    }

    setSubmitting(true);
    try {
      const dispute = await CustomerPortalApiService.createDispute({
        agreement_id: agreementId,
        charge_id: chargeId,
        subject: subject.trim(),
        description: description.trim(),
      });
      Alert.alert('Success', 'Dispute created successfully', [
        { text: 'OK', onPress: () => navigation.navigate('DisputeDetail', { disputeId: dispute.id }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create dispute');
    } finally {
      setSubmitting(false);
    }
  }, [subject, description, agreementId, chargeId, navigation]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
          placeholder="Brief description of the issue"
          placeholderTextColor={Colors.textLight}
          maxLength={200}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Provide details about your dispute..."
          placeholderTextColor={Colors.textLight}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.button, submitting && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.buttonText}>Submit Dispute</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  form: { padding: Spacing.xl },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
    minHeight: 150,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
});

export default CreateDisputeScreen;
