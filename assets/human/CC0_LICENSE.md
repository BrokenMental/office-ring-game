# MakeHuman base mesh — CC0 1.0 Universal

Source: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj
Asset license: https://github.com/makehumancommunity/makehuman/blob/master/LICENSE.ASSETS.md
https://creativecommons.org/publicdomain/zero/1.0/

Original asset header:
This asset was explicitly released as CC0 in september 2020.
Copyright holders at the point of release:
Copyright (C) 2020 Data Collection AB, https://www.datacollection.se
Copyright (C) 2020 Joel Palmius
Copyright (C) 2020 Jonas Hauquier
Primary legal contact: Data Collection AB.

OFFICE RING uses an extracted head/neck mesh, a connected upper-body/arm mesh,
and reference eye positions. The body is in anatomical-body.json (2,604 vertices,
5,050 triangles). scripts/build-human-body.py reproduces the extraction from base.obj.
Coordinates were transformed, geometry triangulated, normals recomputed, and
rendering materials, hair, facial proportions and accessories are project adaptations.
The body also has project-created five-bone skin weights, garment fitting and
runtime shoulder/elbow deformation. The unclothed universal base is fitted to
the game's clothed office characters; it is not an unmodified character scan.
No MakeHuman application source code is included.

2026-11-11: OFFICE RING adds outfit-dependent long sleeves, garment ease,
barycentric attachments to the posed chest, a folded hood and inner tee,
jacket lapels/fronts/shirt/tie and wrist cuffs. These are project-created
runtime geometry; the original CC0 human topology and attribution are preserved.

2026-11-11 follow-up: clipped head-neck triangles, a smooth runtime neck bridge,
cloth fold attachments, polo placket, thin silver glasses/pin and hair shading
are project adaptations. The CC0 source geometry and attribution are retained.

2026-11-11 expression update: small personality-dependent mouth/eyelid vertex
adjustments and wavy hair volume are runtime project adaptations.

2026-11-11 continuity update: chest pocket and two pen attachments follow
the posed chest surface. Original CC0 attribution and topology are retained.

2026-11-11: long-parted temple hair strips and hollow gold-hoop geometry
are OFFICE RING runtime additions. The original CC0 source remains unchanged.
