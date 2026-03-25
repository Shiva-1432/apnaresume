import { ImageResponse } from 'next/og';

export const alt = 'ApnaResume';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 60%, #22c55e 100%)',
          color: '#ffffff',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: -1 }}>ApnaResume</div>
        <div style={{ fontSize: 34, marginTop: 16 }}>AI Resume Analyzer and ATS Score Checker</div>
      </div>
    ),
    size,
  );
}
