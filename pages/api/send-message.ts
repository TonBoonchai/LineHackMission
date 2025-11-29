import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get LIFF Access Token from request header
  const liffAccessToken = req.headers['x-liff-access-token'] as string;

  if (!liffAccessToken) {
    return res.status(400).json({ error: 'LIFF Access Token is required' });
  }

  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const templateName = process.env.LINE_SERVICE_MESSAGE_TEMPLATE_NAME;

  if (!channelId || !channelSecret) {
    return res.status(500).json({ error: 'LINE_CHANNEL_ID and LINE_CHANNEL_SECRET must be configured' });
  }

  if (!templateName) {
    return res.status(500).json({ error: 'LINE_SERVICE_MESSAGE_TEMPLATE_NAME must be configured' });
  }

  try {
    // Step 1: Create Stateless Channel Access Token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v3/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: channelId,
        client_secret: channelSecret
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      console.error('Failed to get stateless token:', error);
      return res.status(tokenResponse.status).json({ error: 'Failed to get stateless token', details: error });
    }

    const tokenData = await tokenResponse.json();
    const statelessToken = tokenData.access_token;

    // Step 2: Issue Service Notification Token
    const notificationTokenResponse = await fetch('https://api.line.me/message/v3/notifier/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${statelessToken}`
      },
      body: JSON.stringify({
        liffAccessToken: liffAccessToken
      })
    });

    if (!notificationTokenResponse.ok) {
      const error = await notificationTokenResponse.json();
      console.error('Failed to issue notification token:', error);
      return res.status(notificationTokenResponse.status).json({ error: 'Failed to issue notification token', details: error });
    }

    const notificationData = await notificationTokenResponse.json();
    const notificationToken = notificationData.notificationToken;

    // Step 3: Send Service Message using template
    const sendMessageResponse = await fetch('https://api.line.me/message/v3/notifier/send?target=service', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${statelessToken}`
      },
      body: JSON.stringify({
        notificationToken: notificationToken,
        templateName: templateName,
        params: {
          // Add your template parameters here
          // Example: date: new Date().toLocaleDateString('th-TH'),
          // btn1_url: 'https://line.me'
        }
      })
    });

    if (!sendMessageResponse.ok) {
      const error = await sendMessageResponse.json();
      console.error('Failed to send service message:', error);
      return res.status(sendMessageResponse.status).json({ error: 'Failed to send service message', details: error });
    }

    const sendData = await sendMessageResponse.json();

    return res.status(200).json({ 
      success: true, 
      message: 'Service message sent successfully',
      remainingCount: sendData.remainingCount,
      notificationToken: sendData.notificationToken
    });
  } catch (error) {
    console.error('Error sending service message:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
