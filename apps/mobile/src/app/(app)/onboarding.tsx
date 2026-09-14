import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useState } from 'react';
import { ScrollView, Switch, View } from 'react-native';

import { CATEGORIES, type ServiceCategory, type ServiceMode } from '@/lib/categories';
import { toE164 } from '@/lib/format';
import { geocodeAddress, getCurrentCoords } from '@/lib/location';
import { spacing, useTheme } from '@/lib/theme';
import { useSaveBusinessProfile } from '@/data/practitioner';
import { useAuth } from '@/providers/AuthProvider';
import { useMode } from '@/providers/ModeProvider';
import { AppText, Button, Chip, Header, Input, Row, Screen, Segmented } from '@/ui';

export default function Onboarding() {
  const { colors } = useTheme();
  const { isAnonymous, isRegistered, finalizePractitioner } = useAuth();
  const { setMode } = useMode();
  const saveBusiness = useSaveBusinessProfile();

  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [years, setYears] = useState('');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('both');
  const [radiusKm, setRadiusKm] = useState('15');
  const [requiresDeposit, setRequiresDeposit] = useState(false);
  const [depositPct, setDepositPct] = useState('20');
  // Only collected here when the user is already registered (else captured at registration).
  const [workAddress, setWorkAddress] = useState('');
  const [payshap, setPayshap] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const toggleCategory = (c: ServiceCategory) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const onSave = async () => {
    if (businessName.trim().length < 2) return setError('Enter your business/display name');
    if (!categories.length) return setError('Pick at least one service category');
    setError(undefined);
    setBusy(true);
    try {
      await saveBusiness.mutateAsync({
        businessName: businessName.trim(),
        bio: bio.trim() || undefined,
        categories,
        yearsExperience: years ? Number(years) : null,
        serviceMode,
        travelRadiusKm: Number(radiusKm) || 15,
        requiresDeposit,
        depositPercentage: requiresDeposit ? Number(depositPct) || 0 : null,
      });

      if (isAnonymous) {
        // Gate: finish personal + login details, which flips on practitioner mode.
        router.push({ pathname: '/(auth)/register', params: { role: 'practitioner' } });
        return;
      }

      // Already registered (e.g. a client becoming a provider): collect payout + work location here.
      if (!toE164(payshap)) {
        setError('Enter a valid PayShap number');
        setBusy(false);
        return;
      }
      const coords = (workAddress.trim() ? await geocodeAddress(workAddress.trim()) : null) ?? (await getCurrentCoords());
      await finalizePractitioner({ payshapProxy: toE164(payshap)!, workCoords: coords, workAddress: workAddress.trim() || null });
      setMode('work');
      router.replace('/(app)');
    } catch (e: any) {
      setError(e.message ?? 'Could not save your profile');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title="Set up your studio" onBack={() => safeBack()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Input label="Business / display name" placeholder="e.g. Glow by Thandi" value={businessName} onChangeText={setBusinessName} />
        <Input label="Bio" placeholder="Tell clients about your work" value={bio} onChangeText={setBio} multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Services you offer
        </AppText>
        <Row style={{ gap: spacing.sm, flexWrap: 'wrap', marginBottom: spacing.lg }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.value} label={c.label} emoji={c.emoji} selected={categories.includes(c.value)} onPress={() => toggleCategory(c.value)} />
          ))}
        </Row>

        <Input label="Years of experience" placeholder="e.g. 5" keyboardType="numeric" value={years} onChangeText={setYears} />

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          How do you work?
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
          <Input label="Travel radius (km)" placeholder="15" keyboardType="numeric" value={radiusKm} onChangeText={setRadiusKm} />
        ) : null}

        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppText weight="600">Require a deposit</AppText>
            <AppText variant="small" color="textMuted">A % of the agreed price to confirm a booking.</AppText>
          </View>
          <Switch value={requiresDeposit} onValueChange={setRequiresDeposit} trackColor={{ true: colors.primary }} />
        </Row>
        {requiresDeposit ? <Input label="Deposit %" placeholder="20" keyboardType="numeric" value={depositPct} onChangeText={setDepositPct} /> : null}

        {isRegistered ? (
          <>
            <AppText variant="small" color="textMuted" weight="600" style={{ marginTop: spacing.md, marginBottom: spacing.sm }}>
              Payouts & base location
            </AppText>
            <Input label="Work address (studio / base)" value={workAddress} onChangeText={setWorkAddress} hint="Used to match you to nearby clients." />
            <Input label="PayShap number" placeholder="072 123 4567" keyboardType="phone-pad" value={payshap} onChangeText={setPayshap} />
          </>
        ) : null}

        {error ? (
          <AppText variant="small" color="danger" style={{ marginBottom: spacing.sm }}>
            {error}
          </AppText>
        ) : null}

        <Button
          title={isAnonymous ? 'Save & register' : 'Save profile'}
          icon="checkmark-done"
          loading={busy || saveBusiness.isPending}
          onPress={onSave}
        />
        <AppText variant="caption" color="textFaint" center style={{ marginTop: spacing.md }}>
          Add your services & portfolio from the Studio tab after this. First 30 days free.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
