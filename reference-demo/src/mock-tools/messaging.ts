/**
 * Mock Messaging Tool
 * 
 * Simulates a customer messaging system. Does nothing but return success.
 * The Permission Protocol requires founder veto for customer messaging.
 */

export interface SendCampaignInput {
  audienceId: string;
  subject: string;
  body: string;
  sendAt?: string;
}

export interface SendResult {
  campaignId: string;
  recipientCount: number;
  success: boolean;
}

/**
 * Mock implementation of messaging.send
 * In reality, this would send emails/SMS to customers.
 * 
 * Permission Protocol will require FOUNDER VETO for customer messaging.
 */
export async function sendCampaignMessage(input: SendCampaignInput): Promise<SendResult> {
  // This is a mock - in reality, this would call SendGrid, Twilio, etc.
  console.log(`  [MOCK] Would send to audience ${input.audienceId}: "${input.subject}"`);
  
  return {
    campaignId: `camp_mock_${Date.now()}`,
    recipientCount: 1000,
    success: true,
  };
}
