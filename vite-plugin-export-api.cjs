/**
 * vite-plugin-export-api.cjs
 * Vite plugin that adds /api/export-excel endpoint during dev server
 */

/**
 * Vite plugin for dev server
 */
function exportApiPlugin() {
  return {
    name: 'export-api',
    configureServer(server) {
      server.middlewares.use('/api/export-excel', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method Not Allowed');
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            // Lazy require inside handler to avoid ESM/CJS bundling issues
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const { generateExcel } = await import('./generate-export.cjs');
            const { risks, projectNo } = JSON.parse(body);
            const buffer = await generateExcel(risks, projectNo || 'All');
            const filename = projectNo && projectNo !== 'All'
              ? `RiskRegister_${projectNo}.xlsx`
              : 'RiskRegister_AllProjects.xlsx';

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
            res.end(buffer);
          } catch (e) {
            console.error('[export-api] Error:', e.message);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
    }
  };
}

module.exports = exportApiPlugin;
