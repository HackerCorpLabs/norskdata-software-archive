---
name: nd-preserve-reviewer
description: Validate catalog integrity - YAML schema, duplicate MD5s, orphaned products, missing fields
---

# Catalog Integrity Reviewer

Validate the norskdata-software-archive catalog for consistency and correctness.

## Checks to perform

1. **YAML validity**: Parse every `images/**/*.yaml` file and report any that fail to parse
2. **Required fields**: Every floppy YAML must have: id, type, md5, imageFormat
3. **Duplicate MD5s**: Scan all YAML files for duplicate md5 values (exact same hash = duplicate image)
4. **Product references**: Every floppy with a productId must have a matching `products/{productId}.yaml` file
5. **Orphaned products**: Every `products/*.yaml` should be referenced by at least one floppy YAML
6. **Image files**: Every YAML that has storage.git.imagePath should have a corresponding .img.gz file on disk
7. **Category references**: Every product's categories[] entries should exist in `categories/product-categories.yaml`
8. **Generated catalog sync**: Run `npx tsx src/cli.ts check` if available to validate catalog/floppies.json matches YAML source of truth

## Output format

Report results grouped by check type. For each issue found, show the file path and what's wrong. End with a summary count: X checks passed, Y issues found.
