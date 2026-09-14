import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, View } from 'react-native';

import {
  BOOKING_MODE_LABEL,
  CATEGORIES,
  type BookingMode,
  type ServiceCategory,
} from '@/lib/categories';
import { formatWhen } from '@/lib/format';
import { getCurrentCoords, reverseGeocode, type Coords } from '@/lib/location';
import { pickFromLibrary } from '@/lib/pickImage';
import { spacing, useTheme } from '@/lib/theme';
import { uploadImage } from '@/lib/upload';
import { useCreateRequest } from '@/data/requests';
import { useAuth } from '@/providers/AuthProvider';
import { usePendingRequest } from '@/providers/PendingRequestProvider';
import { AppText, Button, Chip, Header, Input, Ionicons, Row, Screen, Segmented } from '@/ui';

export default function NewRequest() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ target?: string; category?: ServiceCategory; businessName?: string }>();
  const { userId, isAnonymous } = useAuth();
  const { setDraft } = usePendingRequest();
  const createRequest = useCreateRequest();

  const [category, setCategory] = useState<ServiceCategory | null>(params.category ?? null);
  const [mode, setMode] = useState<BookingMode>('mobile');
  const [description, setDescription] = useState('');
  const [asap, setAsap] = useState(true);
  const [when, setWhen] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [consent, setConsent] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    getCurrentCoords().then(async (c) => {
      setCoords(c);
      const a = await reverseGeocode(c);
      if (a) setAddress(a);
    });
  }, []);

  const directed = !!params.target;

  const onPickPhoto = async () => {
    const img = await pickFromLibrary(false);
    if (!img || !userId) return;
    setPreview(`data:${img.mimeType ?? 'image/jpeg'};base64,${img.base64}`);
    setUploading(true);
    try {
      const url = await uploadImage('request-photos', userId, img);
      setImageUrl(url);
    } catch {
      setError('Could not upload the photo. Try again.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!category) return setError('Pick a service category');
    if (!coords) return setError('We need your location to match you with pros');
    setError(undefined);

    const requestInput = {
      category,
      bookingMode: mode,
      coords,
      description: description.trim() || undefined,
      address: address.trim() || undefined,
      scheduledAt: asap ? null : when.toISOString(),
      budgetMin: budgetMin ? Number(budgetMin) : null,
      budgetMax: budgetMax ? Number(budgetMax) : null,
      imageUrl,
      targetPractitionerId: params.target ?? null,
      consent,
    };

    // Gate: must register before publishing.
    if (isAnonymous) {
      setDraft(requestInput);
      router.push({ pathname: '/(auth)/register', params: { role: 'client' } });
      return;
    }

    try {
      const id = await createRequest.mutateAsync(requestInput);
      router.replace(`/(app)/request/${id}`);
    } catch (e: any) {
      setError(e.message ?? 'Could not post request');
    }
  };

  return (
    <Screen>
      <Header title={directed ? `Request from ${params.businessName ?? 'pro'}` : 'Post a request'} onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          What do you need?
        </AppText>
        <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.lg }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} label={c.label} emoji={c.emoji} selected={category === c.value} onPress={() => setCategory(c.value)} />
          ))}
        </Row>

        {/* Photo */}
        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Reference photo (optional)
        </AppText>
        {preview ? (
          <Image source={{ uri: preview }} style={{ width: '100%', height: 180, borderRadius: 16, marginBottom: spacing.md }} contentFit="cover" />
        ) : null}
        <Button
          title={uploading ? 'Uploading…' : preview ? 'Change photo' : 'Add a photo'}
          icon="image"
          variant="secondary"
          loading={uploading}
          onPress={onPickPhoto}
          style={{ marginBottom: spacing.lg }}
        />

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Where?
        </AppText>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'mobile', label: BOOKING_MODE_LABEL.mobile },
            { value: 'studio', label: BOOKING_MODE_LABEL.studio },
          ]}
        />
        <View style={{ height: spacing.md }} />
        <Input label="Address / area" placeholder="Where should the service happen?" value={address} onChangeText={setAddress} />

        <Input
          label="Details (optional)"
          placeholder="e.g. Gel overlay + nail art, medium length"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />

        {/* When */}
        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <AppText variant="small" color="textMuted" weight="600">
            As soon as possible
          </AppText>
          <Switch value={asap} onValueChange={setAsap} trackColor={{ true: colors.primary }} />
        </Row>
        {!asap ? (
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.card }}
          >
            <Row style={{ justifyContent: 'space-between' }}>
              <AppText>{formatWhen(when.toISOString())}</AppText>
              <Ionicons name="calendar" size={18} color={colors.primary} />
            </Row>
          </Pressable>
        ) : null}
        {showPicker ? (
          <DateTimePicker
            value={when}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(_e, d) => {
              setShowPicker(Platform.OS === 'ios');
              if (d) setWhen(d);
            }}
          />
        ) : null}

        {/* Budget range */}
        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Budget range (optional, Rand)
        </AppText>
        <Row style={{ gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input label="Min" placeholder="200" keyboardType="numeric" value={budgetMin} onChangeText={setBudgetMin} />
          </View>
          <View style={{ flex: 1 }}>
            <Input label="Max" placeholder="400" keyboardType="numeric" value={budgetMax} onChangeText={setBudgetMax} />
          </View>
        </Row>

        {/* Consent */}
        <Pressable onPress={() => setConsent((v) => !v)}>
          <Row style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
            <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={22} color={consent ? colors.primary : colors.textFaint} />
            <AppText variant="small" color="textMuted" style={{ flex: 1 }}>
              I'm happy for a photo of the finished work to appear in the pro's public portfolio.
            </AppText>
          </Row>
        </Pressable>

        {error ? (
          <AppText variant="small" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}

        <Button
          title={isAnonymous ? 'Register & publish' : directed ? 'Send request' : 'Post to nearby pros'}
          icon="send"
          loading={createRequest.isPending}
          onPress={onSubmit}
        />
      </ScrollView>
    </Screen>
  );
}
