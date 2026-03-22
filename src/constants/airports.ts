/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Region = 'north' | 'central' | 'south';

export interface Airport {
  iata: string;
  name: string;
  city: string;
  region: Region;
  regionLabel: string;
  country: string;
}

export const AIRPORTS: Airport[] = [
  // Miền Bắc
  {
    iata: 'HAN',
    name: 'Sân bay quốc tế Nội Bài',
    city: 'Hà Nội',
    region: 'north',
    regionLabel: 'Miền Bắc',
    country: 'Việt Nam',
  },
  {
    iata: 'HPH',
    name: 'Sân bay quốc tế Cát Bi',
    city: 'Hải Phòng',
    region: 'north',
    regionLabel: 'Miền Bắc',
    country: 'Việt Nam',
  },
  {
    iata: 'VDH',
    name: 'Sân bay Đồng Hới',
    city: 'Đồng Hới',
    region: 'north',
    regionLabel: 'Miền Bắc',
    country: 'Việt Nam',
  },
  {
    iata: 'THD',
    name: 'Sân bay Thọ Quản',
    city: 'Thanh Hóa',
    region: 'north',
    regionLabel: 'Miền Bắc',
    country: 'Việt Nam',
  },
  {
    iata: 'DIN',
    name: 'Sân bay Điện Biên Phủ',
    city: 'Điện Biên',
    region: 'north',
    regionLabel: 'Miền Bắc',
    country: 'Việt Nam',
  },

  // Miền Trung
  {
    iata: 'DAD',
    name: 'Sân bay quốc tế Đà Nẵng',
    city: 'Đà Nẵng',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },
  {
    iata: 'VCL',
    name: 'Sân bay Chu Lai',
    city: 'Tam Kỳ',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },
  {
    iata: 'HUI',
    name: 'Sân bay Phú Bài',
    city: 'Huế',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },
  {
    iata: 'TBB',
    name: 'Sân bay Tuy Hòa',
    city: 'Tuy Hòa',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },
  {
    iata: 'UIH',
    name: 'Sân bay Pleiku',
    city: 'Pleiku',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },
  {
    iata: 'CXR',
    name: 'Sân bay Cam Ranh',
    city: 'Nha Trang',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },

  // Miền Nam
  {
    iata: 'SGN',
    name: 'Sân bay quốc tế Tân Sơn Nhất',
    city: 'Hồ Chí Minh',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'VCA',
    name: 'Sân bay quốc tế Cần Thơ',
    city: 'Cần Thơ',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'PQC',
    name: 'Sân bay quốc tế Phú Quốc',
    city: 'Phú Quốc',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'VKG',
    name: 'Sân bay Rạch Giá',
    city: 'Rạch Giá',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'SQR',
    name: 'Sân bay Sóc Trăng',
    city: 'Sóc Trăng',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'CMT',
    name: 'Sân bay Cà Mau',
    city: 'Cà Mau',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'CAH',
    name: 'Sân bay Côn Đảo',
    city: 'Côn Đảo',
    region: 'south',
    regionLabel: 'Miền Nam',
    country: 'Việt Nam',
  },
  {
    iata: 'BMV',
    name: 'Sân bay Buôn Ma Thuột',
    city: 'Buôn Ma Thuột',
    region: 'central',
    regionLabel: 'Miền Trung',
    country: 'Việt Nam',
  },
];

export const AIRPORTS_BY_REGION = {
  north: AIRPORTS.filter(a => a.region === 'north'),
  central: AIRPORTS.filter(a => a.region === 'central'),
  south: AIRPORTS.filter(a => a.region === 'south'),
};

export const AIRPORT_MAP: Record<string, Airport> = Object.fromEntries(
  AIRPORTS.map(a => [a.iata, a])
);

export function formatAirportOption(airport: Airport): string {
  return `${airport.city} (${airport.iata})`;
}

export function formatAirportShort(airport: Airport): string {
  return `${airport.iata}`;
}

export function getAirportByIata(iata: string): Airport | undefined {
  return AIRPORT_MAP[iata.toUpperCase()];
}

export function getAirportsByRegion(region: Region): Airport[] {
  return AIRPORTS_BY_REGION[region];
}

export function searchAirports(query: string): Airport[] {
  if (!query.trim()) return AIRPORTS;
  const q = query.toLowerCase();
  return AIRPORTS.filter(
    a =>
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
  );
}
