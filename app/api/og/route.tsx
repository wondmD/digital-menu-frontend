import { ImageResponse } from 'next/og';
import { getImageUrl } from '@/lib/utils';
import { getSiteUrl } from '@/lib/site-url';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const siteHost = (() => {
      try {
        return new URL(getSiteUrl()).host.replace(/^www\./, "")
      } catch {
        return "agelgil.com"
      }
    })()

    const { searchParams } = new URL(request.url);

    const name = searchParams.get('name') || 'Agelgil';
    const description = searchParams.get('description') || 'Digital Menu Experience';
    const logo = searchParams.get('logo');
    const cover = searchParams.get('cover');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'radial-gradient(circle at 25px 25px, #f1f1f1 2%, transparent 0%), radial-gradient(circle at 75px 75px, #f1f1f1 2%, transparent 0%)',
            backgroundSize: '100px 100px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Background decorative elements */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'rgba(230, 57, 70, 0.05)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -100,
              left: -100,
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'rgba(230, 57, 70, 0.03)',
            }}
          />

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: '30px',
              border: '1px solid rgba(230, 57, 70, 0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.05)',
              width: '80%',
            }}
          >
            {logo && (
              <img
                src={logo}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '25px',
                  marginBottom: '24px',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                  objectFit: 'cover',
                }}
              />
            )}
            <h1
              style={{
                fontSize: '60px',
                fontWeight: '900',
                color: '#1a1a1a',
                margin: '0 0 16px 0',
                letterSpacing: '-2px',
                textTransform: 'uppercase',
              }}
            >
              {name}
            </h1>
            <p
              style={{
                fontSize: '24px',
                color: '#666',
                margin: '0',
                maxWidth: '600px',
                lineHeight: '1.4',
                fontWeight: '500',
                fontStyle: 'italic',
              }}
            >
              {description}
            </p>
            
            <div
              style={{
                marginTop: '40px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  backgroundColor: '#e63946',
                  color: 'white',
                  padding: '8px 24px',
                  borderRadius: '100px',
                  fontSize: '18px',
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                View Menu
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#999',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                }}
              >
                {siteHost}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
