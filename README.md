# Segmento Comercial · loja (protótipo de pré-venda)

Protótipo da loja nova da Segmento Comercial (EPI, ferragens, sinalização e fabricação de placas, São Paulo), feito pela OX Mídia como material da reunião de apresentação. **Noindex** até o fechamento; o domínio final e a plataforma de e-commerce são decididos depois.

- Stack: Astro 5 + ilhas React 19 + Tailwind 4. Estático.
- Dados: `src/data/produtos.json` (828 produtos lidos da loja atual e normalizados) e `src/data/taxonomia-nova.json`. Gerados em `clientes/segmento-comercial/catalogo/` no repositório-mãe; `npm run sync:catalogo` copia.
- Imagens de produto em `public/produtos/` (webp 800 e 320). Fotos de ambiente em `public/img/` são ilustrativas (geradas), marcadas com `data-trocar`.
- Comandos: `npm install` · `npm run dev` · `npm run build` · `npm run preview`.
- Indexação: `PUBLIC_INDEXAVEL=true` no build libera `index, follow` (e trocar `public/robots.txt`).

Identidade e regras em `clientes/segmento-comercial/identidade/design-guide.md` (repositório-mãe).
