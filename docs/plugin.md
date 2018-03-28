# Ayria plugin

## Package
All the files for an Ayria plugin are packed in a ZIP archive file. Inside it: binary file(s) and a plugin manifest file.

## Manifest
Metadata about the plugin is placed in a `ayria-plugin.yaml` file, an example manifest:
```yaml
name: Kicking ninja's
version: 5.0.3
description: ''
games:
- platform: steam
  id: 219740
- platform: steam
  id: 431730
```
