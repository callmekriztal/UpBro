/**
 * Notification Service Abstraction
 * 
 * Decouples alert dispatching (Email, Slack, PagerDuty, Webhooks) from core worker incident logic.
 * Allows swapping production email adapters (e.g. Resend, SendGrid) cleanly.
 */
class NotificationService {
  /**
   * Send alert notification when an incident opens
   * @param {Object} incident - Incident document
   * @param {Object} monitor - Monitor document
   */
  async sendIncidentAlert(incident, monitor) {
    const timestamp = new Date(incident.startedAt).toLocaleString();
    const alertMessage = `🔴 ALERT: Monitor "${monitor.name}" (${monitor.url}) is DOWN since ${timestamp}.\nReason: ${incident.reason}`;

    // For local dev, log formatted alert cleanly to console.
    // In production: await emailProvider.send({ to: user.email, subject: `ALERT: ${monitor.name} is DOWN`, body: alertMessage });
    console.log('\n=================== 🚨 INCIDENT NOTIFICATION 🚨 ===================');
    console.log(alertMessage);
    console.log('===================================================================\n');

    return { sent: true, type: 'ALERT', message: alertMessage };
  }

  /**
   * Send recovery notification when an incident resolves
   * @param {Object} incident - Incident document
   * @param {Object} monitor - Monitor document
   */
  async sendIncidentRecovery(incident, monitor) {
    const timestamp = new Date(incident.resolvedAt).toLocaleString();
    const recoveryMessage = `🟢 RESOLVED: Monitor "${monitor.name}" (${monitor.url}) is back ONLINE as of ${timestamp}.\nOutage Duration: ${incident.durationSeconds} seconds.`;

    console.log('\n=================== 🟢 RECOVERY NOTIFICATION 🟢 ===================');
    console.log(recoveryMessage);
    console.log('===================================================================\n');

    return { sent: true, type: 'RECOVERY', message: recoveryMessage };
  }
}

module.exports = new NotificationService();
