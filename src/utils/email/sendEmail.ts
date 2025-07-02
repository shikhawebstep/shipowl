import nodemailer from "nodemailer";

interface EmailAddress {
    name: string;
    email: string;
}

interface EmailAttachment {
    name: string;
    path: string;
}

interface SMTPConfig {
    host: string; // SMTP server hostname
    port: number; // SMTP server port
    secure: boolean; // Use TLS/SSL for connection
    username: string; // SMTP authentication username
    password: string; // SMTP authentication password
    from_email: string; // Sender's email address
    from_name: string; // Sender's name to appear in "From" field (e.g., "Company Name")
}

interface MailData {
    recipient: EmailAddress[];
    cc?: EmailAddress[];
    bcc?: EmailAddress[];
    subject: string;
    htmlBody: string;
    attachments?: EmailAttachment[];
}

interface EmailResult {
    status: boolean;
    messageId?: string;
    error?: string;
}

/**
 * Sends a professional HTML email with optional CC, BCC, and attachments.
 */
export async function sendEmail(
    config: SMTPConfig,
    mailData: MailData
): Promise<EmailResult> {
    const { host, port, secure, username, password, from_email, from_name } = config;
    const {
        recipient = [],
        cc = [],
        bcc = [],
        subject,
        htmlBody,
        attachments = [],
    } = mailData;

    const formatAddressList = (list: EmailAddress[]) =>
        Array.isArray(list) ? list.map(({ name, email }) => `${name} <${email}>`) : [];

    const formatAttachments = (list: EmailAttachment[]) =>
        list.map(({ name, path }) => ({
            filename: name,
            path: path,
        }));

    try {
        const transporter = nodemailer.createTransport({
            host,
            port: Number(port),
            secure,
            auth: { user: username, pass: password },
        });

        const mailOptions = {
            from: `${from_name} <${from_email}>`,
            to: formatAddressList(recipient),
            cc: formatAddressList(cc),
            bcc: formatAddressList(bcc),
            subject,
            html: htmlBody,
            attachments: formatAttachments(attachments),
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`📤 Email sent to ${mailOptions.to.join(", ")} | ID: ${info.messageId}`);
        return { status: true, messageId: info.messageId };
    } catch (error) {
        // Specify a type other than 'any' for the error
        if (error instanceof Error) {
            console.error("❌ Email Error:", error.message);
            return { status: false, error: error.message };
        } else {
            console.error("❌ Unknown Error:", error);
            return { status: false, error: "Unknown error occurred" };
        }
    }
}
