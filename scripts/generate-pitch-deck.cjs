const path = require('path')

const runtimeNodeModules =
  process.env.CODEX_RUNTIME_NODE_MODULES ||
  '/Users/felixayoola/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'
const PptxGenJS = require(path.join(runtimeNodeModules, 'pptxgenjs'))

const deck = new PptxGenJS()
deck.layout = 'LAYOUT_WIDE'
deck.author = 'Codex'
deck.company = 'Slick'
deck.subject = 'Programmable monetization layer on Solana'
deck.title = 'Slick Pitch Deck'
deck.lang = 'en-US'
deck.theme = {
  headFontFace: 'Aptos Display',
  bodyFontFace: 'Aptos',
  lang: 'en-US',
}

const palette = {
  ink: '0B1720',
  slate: '49616F',
  sky: '7FD1C8',
  mint: 'DFF7F2',
  cream: 'F9F7F1',
  sand: 'F0E6D7',
  ember: 'EE8D5A',
  night: '071018',
  white: 'FFFFFF',
}

function addPageBase(slide, background = palette.cream) {
  slide.background = { color: background }
  slide.addText('Slick', {
    x: 0.45,
    y: 0.2,
    w: 1.1,
    h: 0.28,
    fontFace: 'Aptos Display',
    fontSize: 13,
    bold: true,
    color: palette.ink,
  })
}

function addTitle(slide, title, subtitle) {
  slide.addText(title, {
    x: 0.6,
    y: 0.7,
    w: 7.2,
    h: 0.9,
    fontFace: 'Aptos Display',
    fontSize: 27,
    bold: true,
    color: palette.ink,
    margin: 0,
  })

  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.62,
      y: 1.55,
      w: 7.6,
      h: 0.5,
      fontSize: 11,
      color: palette.slate,
      margin: 0,
    })
  }
}

function addBulletList(slide, items, options = {}) {
  const {
    x = 0.75,
    y = 2.0,
    w = 5.8,
    h = 3.4,
    color = palette.ink,
    fontSize = 18,
  } = options

  slide.addText(
    items.map((item) => ({
      text: item,
      options: { bullet: { indent: 16 } },
    })),
    {
      x,
      y,
      w,
      h,
      fontFace: 'Aptos',
      fontSize,
      color,
      breakLine: false,
      paraSpaceAfterPt: 12,
      valign: 'top',
      margin: 0,
    },
  )
}

function addFooter(slide, label) {
  slide.addText(label, {
    x: 10.5,
    y: 6.85,
    w: 2.2,
    h: 0.25,
    align: 'right',
    fontSize: 8,
    color: palette.slate,
    margin: 0,
  })
}

function addCard(slide, opts) {
  slide.addShape(deck.ShapeType.roundRect, {
    x: opts.x,
    y: opts.y,
    w: opts.w,
    h: opts.h,
    rectRadius: 0.08,
    line: { color: opts.lineColor || palette.sand, pt: 1 },
    fill: { color: opts.fillColor || palette.white },
  })

  if (opts.kicker) {
    slide.addText(opts.kicker, {
      x: opts.x + 0.18,
      y: opts.y + 0.16,
      w: opts.w - 0.36,
      h: 0.24,
      fontSize: 9,
      bold: true,
      color: opts.kickerColor || palette.ember,
      margin: 0,
    })
  }

  slide.addText(opts.title, {
    x: opts.x + 0.18,
    y: opts.y + 0.46,
    w: opts.w - 0.36,
    h: 0.5,
    fontFace: 'Aptos Display',
    fontSize: 16,
    bold: true,
    color: palette.ink,
    margin: 0,
  })

  if (opts.body) {
    slide.addText(opts.body, {
      x: opts.x + 0.18,
      y: opts.y + 0.98,
      w: opts.w - 0.36,
      h: opts.h - 1.1,
      fontSize: 11,
      color: palette.slate,
      margin: 0,
      valign: 'top',
    })
  }
}

function addFlowNode(slide, x, y, title, body, fill) {
  slide.addShape(deck.ShapeType.roundRect, {
    x,
    y,
    w: 2.15,
    h: 1.2,
    rectRadius: 0.08,
    line: { color: fill, pt: 1.2 },
    fill: { color: palette.white },
  })
  slide.addText(title, {
    x: x + 0.16,
    y: y + 0.16,
    w: 1.8,
    h: 0.3,
    fontFace: 'Aptos Display',
    fontSize: 15,
    bold: true,
    color: palette.ink,
    margin: 0,
  })
  slide.addText(body, {
    x: x + 0.16,
    y: y + 0.52,
    w: 1.82,
    h: 0.44,
    fontSize: 10,
    color: palette.slate,
    margin: 0,
  })
}

function addArrow(slide, x, y, w, color) {
  slide.addShape(deck.ShapeType.chevron, {
    x,
    y,
    w,
    h: 0.36,
    line: { color, pt: 0 },
    fill: { color },
  })
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  slide.addShape(deck.ShapeType.roundRect, {
    x: 0.62,
    y: 0.82,
    w: 1.9,
    h: 0.4,
    rectRadius: 0.08,
    line: { color: palette.sky, pt: 0 },
    fill: { color: palette.mint },
  })
  slide.addText('48-hour launch mode', {
    x: 0.84,
    y: 0.93,
    w: 1.5,
    h: 0.16,
    fontSize: 10,
    bold: true,
    color: palette.ink,
    margin: 0,
  })
  slide.addText('Programmable monetization\nlayer on Solana', {
    x: 0.62,
    y: 1.55,
    w: 6.4,
    h: 1.8,
    fontFace: 'Aptos Display',
    fontSize: 28,
    bold: true,
    color: palette.ink,
    margin: 0,
  })
  slide.addText(
    'A creator sets a price. A buyer pays in SOL. Content unlocks. Access can become a transferable NFT.',
    {
      x: 0.66,
      y: 3.55,
      w: 5.2,
      h: 0.7,
      fontSize: 16,
      color: palette.slate,
      margin: 0,
    },
  )
  slide.addShape(deck.ShapeType.rect, {
    x: 8.2,
    y: 1.1,
    w: 3.7,
    h: 4.9,
    line: { color: palette.night, pt: 0 },
    fill: { color: palette.night },
  })
  slide.addText('Creator', {
    x: 8.55,
    y: 1.55,
    w: 1.1,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: palette.sky,
    margin: 0,
  })
  slide.addText('Link', {
    x: 10.25,
    y: 2.45,
    w: 0.8,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: palette.sky,
    margin: 0,
  })
  slide.addText('Buyer', {
    x: 8.5,
    y: 3.3,
    w: 1.1,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: palette.sky,
    margin: 0,
  })
  slide.addText('Access pass', {
    x: 9.7,
    y: 4.25,
    w: 1.6,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: palette.sky,
    margin: 0,
  })
  addArrow(slide, 9.4, 2.08, 0.8, palette.ember)
  addArrow(slide, 9.15, 4.02, 0.8, palette.ember)
  slide.addText('https://slick-web-lemon.vercel.app', {
    x: 0.66,
    y: 6.25,
    w: 4.6,
    h: 0.28,
    fontSize: 11,
    color: palette.ember,
    bold: true,
    margin: 0,
  })
  addFooter(slide, '1 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'Creators still rent monetization from closed platforms.')
  slide.addText('Every time a creator charges online, they usually lose one of three things.', {
    x: 0.65,
    y: 1.58,
    w: 5.3,
    h: 0.35,
    fontSize: 12,
    color: palette.slate,
    margin: 0,
  })
  addCard(slide, {
    x: 0.7,
    y: 2.15,
    w: 3.7,
    h: 1.35,
    kicker: 'Margin',
    title: 'Platform fees stack up fast',
    body: 'Paid access usually lives inside someone else’s checkout, audience, and take-rate.',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 0.7,
    y: 3.72,
    w: 3.7,
    h: 1.35,
    kicker: 'Control',
    title: 'Brand and distribution get diluted',
    body: 'The creator’s product becomes a feature inside a larger platform instead of a direct relationship.',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 0.7,
    y: 5.28,
    w: 3.7,
    h: 1.1,
    kicker: 'Portability',
    title: 'Access usually cannot travel',
    body: 'Once payment is complete, the unlock is rarely reusable anywhere else.',
    fillColor: palette.white,
  })
  slide.addShape(deck.ShapeType.rect, {
    x: 5.1,
    y: 2.05,
    w: 6.4,
    h: 4.6,
    line: { color: palette.mint, pt: 0 },
    fill: { color: palette.mint },
  })
  slide.addText('We are not building another creator platform.\n\nWe are building the programmable monetization layer underneath it.', {
    x: 5.55,
    y: 3.0,
    w: 5.2,
    h: 1.6,
    fontFace: 'Aptos Display',
    fontSize: 22,
    bold: true,
    color: palette.ink,
    align: 'center',
    valign: 'mid',
    margin: 0,
  })
  addFooter(slide, '2 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'Current solutions are either closed, clunky, or non-portable.')
  addCard(slide, {
    x: 0.7,
    y: 2.0,
    w: 3.55,
    h: 3.9,
    kicker: 'Platform-first',
    title: 'Traditional creator tools',
    body: 'Easy checkout.\n\nAudience lives on the platform.\n\nTake-rate stays with the intermediary.\n\nAccess is not portable.',
  })
  addCard(slide, {
    x: 4.55,
    y: 2.0,
    w: 3.55,
    h: 3.9,
    kicker: 'Crypto-native but awkward',
    title: 'Wallet payment experiments',
    body: 'On-chain rails are real.\n\nUX often feels bolted on.\n\nUnlock logic is fragile.\n\nFew products make access reusable.',
  })
  addCard(slide, {
    x: 8.4,
    y: 2.0,
    w: 3.55,
    h: 3.9,
    kicker: 'Our position',
    title: 'Slick',
    body: 'Direct creator link.\n\nPayment in SOL.\n\nUnlock immediately.\n\nTurn access into a wallet-held pass when it matters.',
    fillColor: palette.night,
    lineColor: palette.night,
    kickerColor: palette.sky,
  })
  addFooter(slide, '3 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'The product is intentionally small so the primitive is obvious.')
  addFlowNode(slide, 0.8, 3.0, 'Creator', 'Sets price, picks unlock model, shares link.', palette.sky)
  addArrow(slide, 3.05, 3.43, 0.65, palette.ember)
  addFlowNode(slide, 3.6, 3.0, 'Buyer', 'Opens the route and pays from a wallet.', palette.sky)
  addArrow(slide, 5.85, 3.43, 0.65, palette.ember)
  addFlowNode(slide, 6.4, 3.0, 'Unlock', 'Content opens immediately after confirmation.', palette.sky)
  addArrow(slide, 8.65, 3.43, 0.65, palette.ember)
  addFlowNode(slide, 9.2, 3.0, 'Access pass', 'Optional NFT-backed portability for the wow moment.', palette.sky)
  slide.addText('Core thesis', {
    x: 0.82,
    y: 1.95,
    w: 1.2,
    h: 0.22,
    fontSize: 10,
    bold: true,
    color: palette.ember,
    margin: 0,
  })
  slide.addText('Money should move the moment access becomes available.', {
    x: 0.82,
    y: 2.2,
    w: 5.4,
    h: 0.5,
    fontFace: 'Aptos Display',
    fontSize: 21,
    bold: true,
    color: palette.ink,
    margin: 0,
  })
  addFooter(slide, '4 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide, palette.night)
  slide.addText('LIVE DEMO', {
    x: 0.8,
    y: 0.9,
    w: 2.2,
    h: 0.4,
    fontFace: 'Aptos Display',
    fontSize: 24,
    bold: true,
    color: palette.sky,
    margin: 0,
  })
  slide.addText('Creator creates a link.\nBuyer pays in SOL.\nAccess unlocks.\nNFT pass makes it portable.', {
    x: 0.85,
    y: 2.05,
    w: 4.8,
    h: 2.6,
    fontFace: 'Aptos Display',
    fontSize: 26,
    bold: true,
    color: palette.white,
    margin: 0,
  })
  slide.addShape(deck.ShapeType.roundRect, {
    x: 0.86,
    y: 5.7,
    w: 5.2,
    h: 0.62,
    rectRadius: 0.08,
    line: { color: palette.ember, pt: 0 },
    fill: { color: palette.ember },
  })
  slide.addText('https://slick-web-lemon.vercel.app', {
    x: 1.12,
    y: 5.92,
    w: 4.7,
    h: 0.18,
    fontSize: 16,
    bold: true,
    color: palette.night,
    margin: 0,
  })
  slide.addText('Portable backup route available even before hosted Supabase tables are live.', {
    x: 7.05,
    y: 2.2,
    w: 4.6,
    h: 0.8,
    fontSize: 17,
    color: palette.white,
    margin: 0,
  })
  slide.addText('Show the QR from the creator screen.\nLet the phone scan.\nKeep Explorer links visible.', {
    x: 7.05,
    y: 3.35,
    w: 3.8,
    h: 1.2,
    fontSize: 15,
    color: palette.sky,
    margin: 0,
  })
  addFooter(slide, '5 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'How it works', 'Keep trust on-chain. Keep everything else lean and product-shaped.')
  addCard(slide, {
    x: 0.8,
    y: 2.1,
    w: 3.25,
    h: 3.3,
    kicker: 'Frontend',
    title: 'React + wallet UX',
    body: 'Creator studio\nBuyer viewer\nPortable-link fallback\nQR handoff\nExplorer verification',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 4.45,
    y: 2.1,
    w: 3.25,
    h: 3.3,
    kicker: 'Chain layer',
    title: 'Solana payment primitive',
    body: 'Content PDA registration\nDirect SOL payment\nNFT-backed access pass\nWallet-native ownership checks',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 8.1,
    y: 2.1,
    w: 3.25,
    h: 3.3,
    kicker: 'Off-chain layer',
    title: 'Supabase for speed',
    body: 'Content metadata\nPrivate storage\nPurchase persistence\nHosted records when schema is ready',
    fillColor: palette.white,
  })
  slide.addText('The MVP wins because every layer is replaceable, composable, and small enough to trust in a live demo.', {
    x: 0.82,
    y: 5.85,
    w: 10.5,
    h: 0.45,
    fontSize: 14,
    color: palette.slate,
    margin: 0,
  })
  addFooter(slide, '6 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'The opportunity is not “all creator spend.” It is the programmable layer inside it.')
  slide.addShape(deck.ShapeType.rect, {
    x: 0.95,
    y: 2.05,
    w: 1.2,
    h: 3.85,
    line: { color: palette.sand, pt: 0 },
    fill: { color: palette.sand },
  })
  slide.addShape(deck.ShapeType.rect, {
    x: 3.1,
    y: 2.55,
    w: 1.2,
    h: 3.35,
    line: { color: palette.mint, pt: 0 },
    fill: { color: palette.mint },
  })
  slide.addShape(deck.ShapeType.rect, {
    x: 5.25,
    y: 3.05,
    w: 1.2,
    h: 2.85,
    line: { color: palette.sky, pt: 0 },
    fill: { color: palette.sky },
  })
  slide.addShape(deck.ShapeType.rect, {
    x: 7.4,
    y: 4.2,
    w: 1.2,
    h: 1.7,
    line: { color: palette.ember, pt: 0 },
    fill: { color: palette.ember },
  })
  slide.addText('Creator economy', { x: 0.85, y: 6.05, w: 1.4, h: 0.3, fontSize: 11, align: 'center', color: palette.ink, margin: 0 })
  slide.addText('Wallet-native spend', { x: 2.75, y: 6.05, w: 1.9, h: 0.3, fontSize: 11, align: 'center', color: palette.ink, margin: 0 })
  slide.addText('Paid access', { x: 5.0, y: 6.05, w: 1.7, h: 0.3, fontSize: 11, align: 'center', color: palette.ink, margin: 0 })
  slide.addText('Our wedge', { x: 7.2, y: 6.05, w: 1.6, h: 0.3, fontSize: 11, align: 'center', color: palette.ink, margin: 0 })
  slide.addText('We only need the smallest composable slice to matter:\n\npaid content, paid tools, meterable APIs, and wallet-native access logic.', {
    x: 9.0,
    y: 2.45,
    w: 2.7,
    h: 2.2,
    fontFace: 'Aptos Display',
    fontSize: 18,
    bold: true,
    color: palette.ink,
    margin: 0,
  })
  slide.addText('Infrastructure businesses win by becoming default plumbing, not by owning every endpoint.', {
    x: 9.0,
    y: 5.1,
    w: 2.45,
    h: 0.8,
    fontSize: 11,
    color: palette.slate,
    margin: 0,
  })
  addFooter(slide, '7 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'Why Solana', 'This is a product choice before it is a protocol choice.')
  addCard(slide, {
    x: 0.8,
    y: 2.2,
    w: 3.45,
    h: 3.5,
    kicker: 'Speed',
    title: 'Fast enough to demo live',
    body: 'The moment between clicking pay and showing the unlock needs to feel impressive, not fragile.',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 4.55,
    y: 2.2,
    w: 3.45,
    h: 3.5,
    kicker: 'Cost',
    title: 'Cheap enough for small digital purchases',
    body: 'Creators need low-friction pricing for notes, files, tutorials, and one-off drops.',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 8.3,
    y: 2.2,
    w: 3.45,
    h: 3.5,
    kicker: 'Composability',
    title: 'Wallets, NFTs, and future logic come for free',
    body: 'Portable access, referral splits, and richer payment logic all get easier once the base primitive works.',
    fillColor: palette.white,
  })
  addFooter(slide, '8 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide)
  addTitle(slide, 'Team and execution posture')
  addCard(slide, {
    x: 0.85,
    y: 2.2,
    w: 3.35,
    h: 3.1,
    kicker: 'Product',
    title: 'Narrative-led build',
    body: 'One hero flow.\nOne wow moment.\nEvery screen designed for a live demo and a real buyer story.',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 4.55,
    y: 2.2,
    w: 3.35,
    h: 3.1,
    kicker: 'Engineering',
    title: 'Lean stack, honest fallback paths',
    body: 'Local Solana scripts.\nHosted frontend.\nPortable demo mode when backend tables are not ready yet.',
    fillColor: palette.white,
  })
  addCard(slide, {
    x: 8.25,
    y: 2.2,
    w: 3.35,
    h: 3.1,
    kicker: 'Demo ops',
    title: 'Built for pressure',
    body: 'Explorer links ready.\nQR handoff ready.\nBackup recording and portable route ready.',
    fillColor: palette.white,
  })
  slide.addText('This team wins the short sprint by making every technical choice serve the story, not the other way around.', {
    x: 0.88,
    y: 5.8,
    w: 10.2,
    h: 0.45,
    fontSize: 13,
    color: palette.slate,
    margin: 0,
  })
  addFooter(slide, '9 / 10')
}

{
  const slide = deck.addSlide()
  addPageBase(slide, palette.night)
  slide.addText('This is not a platform.\nIt is infrastructure.', {
    x: 0.85,
    y: 1.1,
    w: 6.0,
    h: 1.4,
    fontFace: 'Aptos Display',
    fontSize: 30,
    bold: true,
    color: palette.white,
    margin: 0,
  })
  slide.addText('Today: creator paywall.\nTomorrow: programmable monetization layer for paid content, paid tools, and wallet-native access everywhere.', {
    x: 0.88,
    y: 3.0,
    w: 5.6,
    h: 1.4,
    fontSize: 16,
    color: palette.sky,
    margin: 0,
  })
  slide.addShape(deck.ShapeType.roundRect, {
    x: 7.25,
    y: 1.4,
    w: 4.3,
    h: 4.5,
    rectRadius: 0.08,
    line: { color: palette.ember, pt: 1.5 },
    fill: { color: palette.night },
  })
  slide.addText('ASK', {
    x: 7.62,
    y: 1.9,
    w: 0.8,
    h: 0.3,
    fontSize: 16,
    bold: true,
    color: palette.ember,
    margin: 0,
  })
  addBulletList(
    slide,
    [
      'Pilot creators willing to test paid drops with wallet-native buyers.',
      'Ecosystem introductions around Solana distribution and creator tooling.',
      'Feedback on where programmable access creates the most leverage first.',
    ],
    {
      x: 7.5,
      y: 2.45,
      w: 3.45,
      h: 2.7,
      color: palette.white,
      fontSize: 16,
    },
  )
  slide.addText('slick-web-lemon.vercel.app', {
    x: 0.9,
    y: 6.35,
    w: 3.2,
    h: 0.28,
    fontSize: 11,
    color: palette.ember,
    bold: true,
    margin: 0,
  })
  addFooter(slide, '10 / 10')
}

const outputPath = path.join(process.cwd(), 'docs', 'slick-pitch-deck.pptx')
deck.writeFile({ fileName: outputPath })
console.log(outputPath)
