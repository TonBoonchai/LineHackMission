import type { Liff } from "@line/liff";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import Head from "next/head";

const Home: NextPage<{ liff: Liff | null; liffError: string | null }> = ({
  liff,
  liffError
}) => {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Show notification when page loads and LIFF is initialized
    if (liff) {
      // Get LIFF Access Token and send service message
      const sendServiceMessage = async () => {
        try {
          const liffAccessToken = liff.getAccessToken();
          
          if (!liffAccessToken) {
            console.error('Failed to get LIFF Access Token');
            return;
          }

          // Call API to send service message
          const response = await fetch('/api/send-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-liff-access-token': liffAccessToken
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Service message sent:', data);
            // Show success notification
            setShowNotification(true);
          } else {
            const error = await response.json();
            console.error('Failed to send message:', error);
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      };

      sendServiceMessage();
    }
  }, [liff]);

  const handleOkClick = () => {
    setShowNotification(false);
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      backgroundColor: '#5a5a5a',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Head>
        <title>LINE MINI App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Notification Popup */}
      {showNotification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '40px 60px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            maxWidth: '80%',
            minWidth: '280px'
          }}>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '30px',
              fontWeight: '400'
            }}>
              Message sent successfully!
            </p>
            <button
              onClick={handleOkClick}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#000',
                cursor: 'pointer',
                padding: '10px 20px'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Show error if LIFF init failed */}
      {liffError && (
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '80%'
        }}>
          <p style={{ color: '#ff0000' }}>LIFF init failed:</p>
          <p><code>{liffError}</code></p>
        </div>
      )}
    </div>
  );
};

export default Home;
