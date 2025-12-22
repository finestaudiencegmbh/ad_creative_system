# Bannerbear Setup Guide

## Step 1: Create Bannerbear Account

1. Go to https://www.bannerbear.com/
2. Sign up for an account (Free trial available)
3. Verify your email

## Step 2: Get API Key

1. Go to Settings → API Keys
2. Copy your Project API Key
3. Save it for later (you'll add it to Manus Secrets)

## Step 3: Create Templates

You need to create 3 templates (one for each format):

### Template 1: Feed (1:1 - Square)
- **Canvas Size:** 1080x1080px
- **Layers:**
  - `background` (Image layer) - Full canvas
  - `eyebrow` (Text layer) - Top 10%, red color (#FF0000), uppercase, 24px
  - `headline` (Text layer) - Center 40%, white/green, bold, 48px, multi-line
  - `cta` (Text layer) - Bottom 15%, purple button (#7C3AED), white text, 32px

### Template 2: Story (9:16 - Vertical)
- **Canvas Size:** 1080x1920px
- **Layers:** Same as Feed but adjusted for vertical layout
  - Safe zones: Top 25%, Bottom 30%
  - Text area: Middle 45%

### Template 3: Reel (9:16 - Vertical)
- **Canvas Size:** 1080x1920px
- **Layers:** Same as Story

## Step 4: Get Template UIDs

1. Open each template in Bannerbear dashboard
2. Copy the Template UID from the URL (e.g., `A89waZ3yr6YjQdN1e0`)
3. Save all 3 UIDs

## Step 5: Add to Manus Secrets

Add these 4 secrets in Manus:

1. `BANNERBEAR_API_KEY` - Your API key from Step 2
2. `BANNERBEAR_TEMPLATE_FEED` - Feed template UID
3. `BANNERBEAR_TEMPLATE_STORY` - Story template UID
4. `BANNERBEAR_TEMPLATE_REEL` - Reel template UID

## Step 6: Test Connection

After adding secrets, the system will automatically test the Bannerbear connection on next creative generation.

## Troubleshooting

### "Template not configured" error
- Make sure you've added all 4 environment variables
- Check that template UIDs are correct (no spaces, exact match)

### "Bannerbear did not return an image URL" error
- Check your API key is valid
- Ensure you have API requests remaining in your plan
- Verify template layers match the expected names (background, eyebrow, headline, cta)

### Font rendering issues
- Bannerbear handles fonts automatically
- If text looks wrong, adjust font settings in template editor
- Recommended fonts: Inter, Montserrat, Poppins

## Pricing

- **Free Trial:** 30 images
- **Starter:** $49/month - 1,000 images
- **Growth:** $149/month - 5,000 images
- **Business:** $399/month - 20,000 images

Each creative generation = 1 image credit
