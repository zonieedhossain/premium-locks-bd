package services

import (
	"fmt"
	"net/smtp"
	"strings"
)

type EmailService struct {
	host     string
	port     string
	user     string
	pass     string
	from     string
	receiver string
}

func NewEmailService(host, port, user, pass, from, receiver string) *EmailService {
	return &EmailService{host: host, port: port, user: user, pass: pass, from: from, receiver: receiver}
}

type ContactMessage struct {
	Name    string
	Email   string
	Phone   string
	Subject string
	Message string
	Time    string
}

func (s *EmailService) SendContactEmail(msg ContactMessage) error {
	if s.host == "" || s.user == "" {
		return fmt.Errorf("SMTP not configured")
	}

	subject := fmt.Sprintf("New contact form message from %s", msg.Name)
	body := fmt.Sprintf(`<html><body>
<h2>New Contact Form Message</h2>
<table style="border-collapse:collapse;width:100%%">
  <tr><td style="padding:8px;font-weight:bold">Name</td><td style="padding:8px">%s</td></tr>
  <tr><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px">%s</td></tr>
  <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">%s</td></tr>
  <tr><td style="padding:8px;font-weight:bold">Subject</td><td style="padding:8px">%s</td></tr>
  <tr><td style="padding:8px;font-weight:bold">Message</td><td style="padding:8px">%s</td></tr>
  <tr><td style="padding:8px;font-weight:bold">Timestamp</td><td style="padding:8px">%s</td></tr>
</table>
</body></html>`, msg.Name, msg.Email, msg.Phone, msg.Subject, strings.ReplaceAll(msg.Message, "\n", "<br>"), msg.Time)

	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	headers := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\n%s", s.from, s.receiver, subject, mime)
	fullMsg := []byte(headers + body)

	addr := s.host + ":" + s.port
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)
	return smtp.SendMail(addr, auth, s.from, []string{s.receiver}, fullMsg)
}
