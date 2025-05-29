import { generateMcpServer } from 'openapi-mcp-generator/dist/index.js';

async function main() {
  try {
    console.log('Starting MCP server generation for Senado Federal API...');

    await generateMcpServer({
      input: 'https://legis.senado.leg.br/dadosabertos/v3/api-docs',
      output: './senado-mcp-server',
      transport: 'web',
      port: 3000,
      force: true
    });

    console.log('MCP server generation completed successfully');
  } catch (error) {
    console.error('Error generating MCP server:', error);
  }
}

main();
