import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';

import { CountryPicker } from '@/components/CountryPicker';
import { toE164 } from '@/lib/format';
import { geocodeAddress, getCurrentCoords } from '@/lib/location';
import { validatePassport, validateSaId } from '@/lib/saId';
import { spacing } from '@/lib/theme';
import { useCreateRequest } from '@/data/requests';
import { EmailInUseError, useAuth } from '@/providers/AuthProvider';
import { usePendingRequest } from '@/providers/PendingRequestProvider';
import type { Enums } from '@/types/database';
import { AppText, Button, Header, Input, Screen, Segmented } from '@/ui';

export default function Register() {
  const { role } = useLocalSearchParams<{ role?: 'client' | 'practitioner' }>();
  const isPractitioner = role === 'practitioner';
  const { registerClient, registerPractitioner } = useAuth();
  const { draft, clear } = usePendingRequest();
  const createRequest = useCreateRequest();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationality, setNationality] = useState<'sa' | 'foreign'>('sa');
  const [country, setCountry] = useState<string | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [homeAddress, setHomeAddress] = useState('');
  const [workAddress, setWorkAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [payshap, setPayshap] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const idType: Enums<'id_type'> = nationality === 'sa' ? 'sa_id' : 'passport';
  const idCheck = useMemo(() => {
    if (!idNumber) return null;
    if (idType === 'sa_id') return validateSaId(idNumber);
    return validatePassport(idNumber)
      ? ({ valid: true } as const)
      : ({ valid: false, reason: 'Passport must be 6–12 letters/numbers' } as const);
  }, [idNumber, idType]);

  const onSubmit = async () => {
    if (firstName.trim().length < 2 || lastName.trim().length < 2) return setError('Enter your first and last name');
    if (nationality === 'foreign' && !country) return setError('Select your country of origin');
    if (!idCheck?.valid) return setError(idCheck?.reason ?? 'Enter a valid ID / passport number');
    const mob = toE164(mobile);
    if (!mob) return setError('Enter a valid mobile number');
    if (!email.trim()) return setError('Enter your email');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (isPractitioner && !toE164(payshap)) return setError('Enter a valid PayShap number');

    setError(undefined);
    setBusy(true);
    try {
      const common = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mob,
        whatsapp: whatsapp ? toE164(whatsapp) : null,
        homeAddress: homeAddress.trim() || null,
        email: email.trim(),
        password,
        idType,
        idNumber: idNumber.trim(),
        idCountry: nationality === 'foreign' ? country : 'South Africa',
      };

      if (isPractitioner) {
        const coords = (workAddress.trim() ? await geocodeAddress(workAddress.trim()) : null) ?? (await getCurrentCoords());
        await registerPractitioner({
          ...common,
          workAddress: workAddress.trim() || null,
          workCoords: coords,
          payshapProxy: toE164(payshap)!,
        });
        router.replace('/(app)');
      } else {
        await registerClient(common);
        if (draft) {
          const id = await createRequest.mutateAsync({
            category: draft.category,
            bookingMode: draft.bookingMode,
            coords: draft.coords,
            description: draft.description,
            address: draft.address,
            scheduledAt: draft.scheduledAt ?? null,
            budgetMin: draft.budgetMin ?? null,
            budgetMax: draft.budgetMax ?? null,
            imageUrl: draft.imageUrl ?? null,
            targetPractitionerId: draft.targetPractitionerId ?? null,
            consent: draft.consent,
          });
          clear();
          router.replace(`/(app)/request/${id}`);
        } else {
          router.replace('/(app)');
        }
      }
    } catch (e: any) {
      if (e instanceof EmailInUseError) {
        setError(e.message);
        router.push('/(auth)/login');
      } else {
        setError(e.message ?? 'Could not create your account');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Header title={isPractitioner ? 'Create provider account' : 'Create your account'} onBack={() => safeBack('/(auth)/welcome')} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        {draft && !isPractitioner ? (
          <AppText variant="small" color="textMuted" style={{ marginBottom: spacing.md }}>
            Almost there — register to publish your request.
          </AppText>
        ) : null}

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          You
        </AppText>
        <Input label="First name" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <Input label="Last name" value={lastName} onChangeText={setLastName} autoCapitalize="words" />

        <Segmented
          value={nationality}
          onChange={setNationality}
          options={[
            { value: 'sa', label: 'South African' },
            { value: 'foreign', label: 'Foreign national' },
          ]}
        />
        <View style={{ height: spacing.md }} />
        {nationality === 'foreign' ? (
          <>
            <CountryPicker value={country} onChange={setCountry} />
            {country ? (
              <Input
                label="Passport number"
                placeholder="e.g. A1234567"
                autoCapitalize="characters"
                value={idNumber}
                onChangeText={setIdNumber}
                error={idCheck && !idCheck.valid ? idCheck.reason : undefined}
                hint={idCheck?.valid ? '✓ Looks good' : undefined}
              />
            ) : (
              <AppText variant="caption" color="textFaint" style={{ marginBottom: spacing.md }}>
                Select your country of origin above to enter your passport number.
              </AppText>
            )}
          </>
        ) : (
          <Input
            label="SA ID number"
            placeholder="13 digits"
            keyboardType="number-pad"
            value={idNumber}
            onChangeText={setIdNumber}
            error={idCheck && !idCheck.valid ? idCheck.reason : undefined}
            hint={idCheck?.valid ? '✓ Looks good' : undefined}
          />
        )}

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Contact
        </AppText>
        <Input label="Mobile number" placeholder="072 123 4567" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />
        <Input label="WhatsApp (if different)" placeholder="Optional" keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} />

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Where
        </AppText>
        <Input label="Home address" value={homeAddress} onChangeText={setHomeAddress} />
        {isPractitioner ? (
          <Input label="Work address (studio / base)" value={workAddress} onChangeText={setWorkAddress} hint="Used to match you to nearby clients." />
        ) : null}

        {isPractitioner ? (
          <>
            <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
              Payouts
            </AppText>
            <Input label="PayShap number" placeholder="072 123 4567" keyboardType="phone-pad" value={payshap} onChangeText={setPayshap} hint="Clients pay you directly here." />
          </>
        ) : null}

        <AppText variant="small" color="textMuted" weight="600" style={{ marginBottom: spacing.sm }}>
          Login
        </AppText>
        <Input label="Email" placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <Input label="Password" placeholder="At least 6 characters" secureTextEntry value={password} onChangeText={setPassword} error={error} />

        <Button
          title={isPractitioner ? 'Create account & save profile' : draft ? 'Register & publish' : 'Create account'}
          icon="checkmark"
          loading={busy || createRequest.isPending}
          onPress={onSubmit}
        />
        <AppText variant="small" color="primary" center style={{ marginTop: spacing.md }} onPress={() => router.push('/(auth)/login')}>
          Already have an account? Log in
        </AppText>
      </ScrollView>
    </Screen>
  );
}
