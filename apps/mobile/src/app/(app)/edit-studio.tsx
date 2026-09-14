import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { Alert, ScrollView, Switch, View } from 'react-native';

import { CATEGORIES, type ServiceCategory, type ServiceMode } from '@/lib/categories';
import { toE164 } from '@/lib/format';
import { getCurrentCoords, reverseGeocode } from '@/lib/location';
import { spacing, useTheme } from '@/lib/theme';
import { useSaveBusinessProfile, useSetLocation, useSetPayshap } from '@/data/practitioner';
import { useAuth } from '@/providers/AuthProvider';
import { AppText, Button, Chip, Header, Input, Row, Screen, Segmented } from '@/ui';

export default function EditStudio() {
  const { colors } = useTheme();
  const { practitioner } = useAuth();
  const save = useSaveBusinessProfile();
  const savePayshap = useSetPayshap();
  const setLocation = useSetLocation();

  const [businessName, setBusinessName] = useState(practitioner?.business_name ?? '');
  const [bio, setBio] = useState(practitioner?.bio ?? '');
  const [categories, setCategories] = useState<ServiceCategory[]>(practitioner?.categories ?? []);
  const [serviceMode, setServiceMode] = useState<ServiceMode>(practitioner?.service_mode ?? 'both');
  const [radiusKm, setRadiusKm] = useState(String(practitioner?.travel_radius_km ?? 15));
  const [payshap, setPayshap] = useState(practitioner?.payshap_proxy ?? '');
  const [requiresDeposit, setRequiresDeposit] = useState(!!practitioner?.requires_deposit);
  const [depositPct, setDepositPct] = useState(String(practitioner?.deposit_percentage ?? 20));
  const [address, setAddress] = useState(practitioner?.base_address ?? '');
  const [error, setError] = useState<string>();

  const toggleCategory = (c: ServiceCategory) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const onUpdateLocation = async () => {
    const coords = await getCurrentCoords();
    const a = await reverseGeocode(coords);
    await setLocation.mutateAsync({ coords, address: a ?? address });
    if (a) setAddress(a);
    Alert.alert('Location updated', 'Your base location has been refreshed.');
  };

  const onSave = async () => {
    if (businessName.trim().length < 2) return setError('Enter your business name');
    if (!categories.length) return setError('Pick at least one category');
    const proxy = toE164(payshap);
    if (!proxy) return setError('Enter a valid PayShap number');
    setError(undefined);
    await save.mutateAsync({
      businessName: businessName.trim(),
      bio: bio.trim() || undefined,
      categories,
      yearsExperience: practitioner?.years_experience ?? null,
      serviceMode,
      travelRadiusKm: Number(radiusKm) || 15,
      requiresDeposit,
      depositPercentage: requiresDeposit ? Number(depositPct) || 0 : null,
    });
    await savePayshap.mutateAsync(proxy);
    safeBack();
  };

  return (
    <Screen>
      <Header title="Edit business details" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Input label="Business name" value={businessName} onChangeText={setBusinessName} />
        <Input label="Bio" value={bio} onChangeText={setBio} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Services
        </AppText>
        <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.lg }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} label={c.label} emoji={c.emoji} selected={categories.includes(c.value)} onPress={() => toggleCategory(c.value)} />
          ))}
        </Row>

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          How you work
        </AppText>
        <Segmented
          value={serviceMode}
          onChange={setServiceMode}
          options={[
            { value: 'studio', label: 'Studio' },
            { value: 'mobile', label: 'Mobile' },
            { value: 'both', label: 'Both' },
          ]}
        />
        <View style={{ height: spacing.md }} />
        {serviceMode !== 'studio' ? (
          <Input label="Travel radius (km)" keyboardType="numeric" value={radiusKm} onChangeText={setRadiusKm} />
        ) : null}

        <Input label="PayShap number" keyboardType="phone-pad" value={payshap} onChangeText={setPayshap} />

        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <AppText weight="600">Require a deposit</AppText>
          <Switch value={requiresDeposit} onValueChange={setRequiresDeposit} trackColor={{ true: colors.primary }} />
        </Row>
        {requiresDeposit ? <Input label="Deposit %" keyboardType="numeric" value={depositPct} onChangeText={setDepositPct} /> : null}

        <Input label="Base address" value={address} onChangeText={setAddress} />
        <Button
          title="Update to my current location"
          variant="secondary"
          icon="location"
          loading={setLocation.isPending}
          onPress={onUpdateLocation}
          style={{ marginBottom: spacing.lg }}
        />

        {error ? (
          <AppText variant="small" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}
        <Button title="Save changes" icon="checkmark" loading={save.isPending || savePayshap.isPending} onPress={onSave} />
      </ScrollView>
    </Screen>
  );
}
