const JIRA_HOST = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_DEFAULT_ISSUE_TYPE_ID = process.env.JIRA_DEFAULT_ISSUE_TYPE_ID;

const authHeader = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')}`;

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function createTicket(req, res) {
  try {
    const { summary, description, email } = req.body;

    if (!summary || typeof summary !== 'string' || !summary.trim()) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'O campo "summary" (título do chamado) é obrigatório.'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'O campo "email" é obrigatório e deve conter um endereço de e-mail válido.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanDescription = description && description.trim() ? description.trim() : 'Sem descrição adicional.';

    const issueTypeConfig = JIRA_DEFAULT_ISSUE_TYPE_ID
      ? { id: String( JIRA_DEFAULT_ISSUE_TYPE_ID) }
      : { name: 'Solicitação de serviço' };

    const payload = {
      fields: {
        project: {
          key: JIRA_PROJECT_KEY
        },
        summary: summary.trim(),
        issuetype: issueTypeConfig,
        description: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '👤 Solicitante: ', marks: [{ type: 'strong' }] },
                { type: 'text', text: cleanEmail }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '📝 Descrição do chamado: ', marks: [{ type: 'strong' }] }
              ]
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: cleanDescription }
              ]
            }
          ]
        }
      }
    };

    const response = await fetch(`${JIRA_HOST}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Erro retornado pela API do Jira',
        status: response.status,
        details: data.errors || data.errorMessages || data
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Ticket criado com sucesso!',
      ticket: {
        id: data.id,
        key: data.key,
        reporterEmail: cleanEmail,
        url: `${JIRA_HOST}/browse/${data.key}`
      }
    });

  } catch (error) {
    console.error('Erro na controller createTicket:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Falha interna ao processar a criação do ticket.'
    });
  }
}

module.exports = {
  createTicket
};