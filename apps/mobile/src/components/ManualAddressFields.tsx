import { useState } from 'react';
import { FlatList, Modal, Pressable, View } from 'react-native';

import {
  COUNTRIES,
  COUNTRY_LIST,
  addressErrors,
  emptyAddress,
  formatAddress,
  isAddressComplete,
  isCityKnown,
  type CountryCode,
  type StructuredAddress,
} from '@smomo/shared';

import { radius, spacing, useTheme } from '@/lib/theme';
import { AppText, Header, Input, Ionicons, Row } from '@/ui';

export type ResolvedAddress = {
  /** The one-line form, for the `address` columns. */
  text: string;
  /**
   * Always null here: nothing geocoded this address. Migration 16 made coordinates
   * optional and matching falls back to `city`, so sending a city-centre point would
   * only make every distance fiction. The field stays for callers that also handle a
   * geolocated place.
   */
  lat: null;
  lng: null;
  country: CountryCode;
  city: string;
};

/** A tap-to-open list, for the two fields whose values are fixed sets. */
function Select({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  error?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View style={{ gap: 6, marginBottom: spacing.md }}>
      <AppText variant="small" color="textMuted" weight="600">
        {label}
      </AppText>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${selected?.label ?? placeholder}`}
        style={{
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: 12,
          backgroundColor: colors.card,
        }}
      >
        <Row style={{ justifyContent: 'space-between' }}>
          <AppText style={{ color: selected ? colors.text : colors.textFaint }}>
            {selected?.label ?? placeholder}
          </AppText>
          <Ionicons name="chevron-down" size={18} color={colors.textFaint} />
        </Row>
      </Pressable>
      {error ? (
        <AppText variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <Header title={label} onBack={() => setOpen(false)} />
          <FlatList
            data={options}
            keyExtractor={(o) => o.value}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
                style={{
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Row style={{ justifyContent: 'space-between' }}>
                  <AppText>{item.label}</AppText>
                  {value === item.value ? (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  ) : null}
                </Row>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

/**
 * The address form used while geolocation is parked — the mobile counterpart of the web's
 * `<ManualAddressField>`, collecting the same fields in the same order so an address
 * typed on one platform reads identically on the other.
 *
 * `onResolved` fires with the composed address once the required fields are filled, and
 * with null while they are not, so the screen can gate its submit button on it. The
 * position is derived from the city rather than a geocoder, so it is city-level at best.
 */
export function ManualAddressFields({
  title,
  hint,
  onResolved,
  initialText,
}: {
  title?: string;
  hint?: string;
  onResolved: (a: ResolvedAddress | null) => void;
  /** An address saved earlier, shown so it isn't silently dropped. */
  initialText?: string | null;
}) {
  const { colors } = useTheme();
  const [addr, setAddr] = useState<StructuredAddress>(() => emptyAddress());
  const [touched, setTouched] = useState<Partial<Record<keyof StructuredAddress, boolean>>>({});
  const country = COUNTRIES[addr.country];
  const fieldErrors = addressErrors(addr);
  const errFor = (k: keyof StructuredAddress) => (touched[k] ? fieldErrors[k] : undefined);

  const set = <K extends keyof StructuredAddress>(key: K, v: StructuredAddress[K]) => {
    const next: StructuredAddress =
      key === 'country'
        ? { ...addr, country: v as CountryCode, subdivision: '' }
        : { ...addr, [key]: v };
    setAddr(next);
    if (isAddressComplete(next)) {
      onResolved({
        text: formatAddress(next),
        lat: null,
        lng: null,
        country: next.country,
        city: next.city.trim(),
      });
    } else {
      onResolved(null);
    }
  };

  const complete = isAddressComplete(addr);

  return (
    <View>
      {title ? (
        <AppText variant="heading" style={{ marginBottom: spacing.xs }}>
          {title}
        </AppText>
      ) : null}
      {hint ? (
        <AppText variant="small" color="textMuted" style={{ marginBottom: spacing.md }}>
          {hint}
        </AppText>
      ) : null}

      {initialText ? (
        <View
          style={{
            backgroundColor: colors.cardMuted,
            borderRadius: radius.md,
            padding: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <AppText variant="caption" color="textMuted">
            Saved earlier: {initialText}
          </AppText>
          <AppText variant="caption" color="textFaint">
            Fill the fields below to replace it.
          </AppText>
        </View>
      ) : null}

      <Select
        label="Country"
        placeholder="Choose country"
        value={addr.country}
        options={COUNTRY_LIST.map((c) => ({ value: c.code, label: c.name }))}
        onChange={(v) => set('country', v as CountryCode)}
      />

      <Input
        label="Address line 1"
        placeholder="12 Main Road"
        value={addr.line1}
        onChangeText={(v) => set('line1', v)}
        onBlur={() => setTouched((t) => ({ ...t, line1: true }))}
        error={errFor('line1')}
      />

      <Input
        label="Address line 2 (optional)"
        placeholder="Unit 4, Oak Court"
        value={addr.line2 ?? ''}
        onChangeText={(v) => set('line2', v)}
      />

      <Input
        label="Suburb"
        placeholder="Rosebank"
        value={addr.suburb}
        onChangeText={(v) => set('suburb', v)}
        onBlur={() => setTouched((t) => ({ ...t, suburb: true }))}
        error={errFor('suburb')}
      />

      <Input
        label="City or town"
        placeholder={country.cities[0]?.name ?? 'City'}
        value={addr.city}
        onChangeText={(v) => set('city', v)}
        onBlur={() => setTouched((t) => ({ ...t, city: true }))}
        error={errFor('city')}
        hint={`Known: ${country.cities.map((c) => c.name).slice(0, 4).join(', ')}…`}
      />

      <Select
        label={country.subdivisionLabel}
        placeholder={`Choose ${country.subdivisionLabel.toLowerCase()}`}
        value={addr.subdivision || null}
        options={country.subdivisions.map((sd) => ({ value: sd, label: sd }))}
        onChange={(v) => set('subdivision', v)}
        error={errFor('subdivision')}
      />

      {complete ? (
        <AppText variant="caption" color="textMuted">
          {isCityKnown(addr)
            ? `We'll match you with pros in ${addr.city}.`
            : `We'll match you with pros who work in ${addr.city}. Distances aren't shown without location.`}
        </AppText>
      ) : null}
    </View>
  );
}

/**
 * Just a search centre, for screens that need "near where?" rather than a full address —
 * Discover being the one. With geolocation parked there is no position to centre on, and
 * silently defaulting to Cape Town would tell someone in Harare that nobody is near them.
 * So they pick, and we use that city's coordinates.
 */
export function CityCentreSelect({
  value,
  onChange,
}: {
  value: { country: CountryCode; city: string } | null;
  onChange: (v: { country: CountryCode; city: string; lat: number; lng: number }) => void;
}) {
  const country = COUNTRIES[value?.country ?? 'ZA'];
  return (
    <View>
      <Select
        label="Country"
        placeholder="Choose country"
        value={country.code}
        options={COUNTRY_LIST.map((c) => ({ value: c.code, label: c.name }))}
        onChange={(code) => {
          const next = COUNTRIES[code as CountryCode];
          const first = next.cities[0];
          onChange({ country: next.code, city: first.name, lat: first.lat, lng: first.lng });
        }}
      />
      <Select
        label="City"
        placeholder="Choose city"
        value={value?.city ?? null}
        options={country.cities.map((c) => ({ value: c.name, label: c.name }))}
        onChange={(name) => {
          const city = country.cities.find((c) => c.name === name);
          if (city) onChange({ country: country.code, city: city.name, lat: city.lat, lng: city.lng });
        }}
      />
    </View>
  );
}
