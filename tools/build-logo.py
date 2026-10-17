#!/usr/bin/env python3
"""Build assets/logo.svg from the lesson buddy poses.

Buddy peeks over a terminal box with his hands resting on its top edge.

Layers (back to front):
  .backs    - the character per pose: idle without arms (they are behind the
              box); celebrate with its own raised arms at rim pivots, which
              CSS pumps for the cheer (hover and click)
  .fronts   - the celebrate arms again, masked to outside the body, so the
              raised arms sit in front of the box with clean seams
  .terminal - the blue box with the prompt
  .hands    - two stubby mitts drawn in the buddy's line style, resting on the
              box edge at the body's sides, in front of body and box (the art's
              own arm paths are open wedges that only work tucked behind the
              body, so they can't be reused as resting hands). Hidden while
              the celebrate pose shows.
"""
import math, re, copy, sys
import xml.etree.ElementTree as ET

NS = 'http://www.w3.org/2000/svg'
ET.register_namespace('', NS)
g = lambda tag: '{%s}%s' % (NS, tag)

POSES = ['idle', 'celebrate']
WHO = 'translate(260,214) scale(0.9) translate(-260,-215)'
WHO_S = 0.9
TERM = dict(x=72, y=280, w=376, h=206, rx=34)
# where each mitt sits (its centre, logo coords) and which way its outer end points
BODY = dict(cx=260, cy=214, r=135)   # every pose maps its body circle here
HAND_RX, HAND_RY = 29, 25
HAND = {'left': (144, 286), 'right': (376, 286)}



def nums(t):
    return [float(x) for x in re.findall(r'-?\d+\.?\d*', t)]


def body_circle(char):
    c = char.find("%s[@class='body']" % g('g')).find(g('circle'))
    return float(c.get('cx')), float(c.get('cy')), float(c.get('r'))


def pivot_wrap(char, arm):
    """translate(E) > g.pivot > translate(-E) > arm, E on the body rim nearest the joint."""
    cx, cy, r = body_circle(char)
    inner = list(arm)[0]
    jx, jy = nums(inner.get('transform'))
    dx, dy = jx - cx, jy - cy
    n = math.hypot(dx, dy)
    E = (cx + dx / n * r, cy + dy / n * r)
    outer = ET.Element(g('g'), transform='translate(%.1f,%.1f)' % E)
    piv = ET.SubElement(outer, g('g'), {'class': 'pivot'})
    back = ET.SubElement(piv, g('g'), transform='translate(%.1f,%.1f)' % (-E[0], -E[1]))
    back.append(copy.deepcopy(arm))
    return outer


def with_arms(char):
    """Back copy (everything, arms at rim pivots) and front copy (arms only)."""
    back = ET.Element(g('g'), {'class': 'char', 'transform': char.get('transform')})
    front = ET.Element(g('g'), {'class': 'char', 'transform': char.get('transform')})
    for ch in char:
        cls = (ch.get('class') or '').split()
        if 'arm-left' in cls or 'arm-right' in cls:
            w = pivot_wrap(char, ch)
            back.append(w)
            front.append(copy.deepcopy(w))
        else:
            back.append(copy.deepcopy(ch))
    return back, front


def strip_arms(char):
    out = ET.Element(g('g'), {'class': 'char', 'transform': char.get('transform')})
    for ch in char:
        cls = (ch.get('class') or '').split()
        if any(c.startswith('arm') for c in cls):
            continue
        out.append(copy.deepcopy(ch))
    return out


def main():
    svg = ET.Element(g('svg'), {
        'viewBox': '0 0 520 520', 'class': 'logo-svg', 'role': 'img', 'aria-label': 'CodeBuddy'})
    backs = ET.SubElement(svg, g('g'), {'class': 'backs'})
    fronts = ET.Element(g('g'), {'class': 'fronts'})
    for p in POSES:
        root = ET.parse(f'assets/buddy/{p}.svg').getroot()
        char = root.find(g('g'))
        if p == 'celebrate':
            char, front = with_arms(char)
        else:
            char, front = strip_arms(char), None
        for el in char.iter():
            for k in ('id', 'clip-path'):
                v = el.get(k)
                if v and 'clip' in v:
                    el.set(k, v.replace(f'{p}-clip', f'logo-{p}-clip'))
        bp = ET.SubElement(backs, g('g'), {'class': f'pose pose-{p}'})
        bw = ET.SubElement(bp, g('g'), transform=WHO)
        bw.append(char)
        if front is not None:
            # the arms again in front of the box, only the part outside the body
            fp = ET.SubElement(fronts, g('g'), {'class': f'pose pose-{p}', 'mask': 'url(#logo-outside)'})
            fw = ET.SubElement(fp, g('g'), transform=WHO)
            fw.append(front)
    term = ET.SubElement(svg, g('g'), {'class': 'terminal'})
    ET.SubElement(term, g('rect'), x=str(TERM['x']), y=str(TERM['y']), width=str(TERM['w']),
                  height=str(TERM['h']), rx=str(TERM['rx']), fill='#1E6FD9')
    glyph = ET.SubElement(term, g('g'), {'fill': 'none', 'stroke': '#FFFFFF', 'stroke-width': '26',
                                         'stroke-linecap': 'round', 'stroke-linejoin': 'round'})
    ET.SubElement(glyph, g('path'), d='M142 338 l60 50 -60 50')
    ET.SubElement(glyph, g('path'), d='M230 438 h84')
    # hands: hidden where they overlap the body above the box (they come from
    # behind it), drawn in front of the box below its top edge
    defs = ET.Element(g('defs'))
    svg.insert(0, defs)
    mask = ET.SubElement(defs, g('mask'), {'id': 'logo-hands', 'maskUnits': 'userSpaceOnUse',
                                           'x': '0', 'y': '0', 'width': '520', 'height': '520'})
    ET.SubElement(mask, g('rect'), x='0', y='0', width='520', height='520', fill='#fff')
    ET.SubElement(mask, g('circle'), cx=str(BODY['cx']), cy=str(BODY['cy']), r=str(BODY['r'] - 4), fill='#000')
    ET.SubElement(mask, g('rect'), x=str(TERM['x']), y=str(TERM['y']), width=str(TERM['w']),
                  height=str(TERM['h']), rx=str(TERM['rx']), fill='#fff')
    defs = ET.Element(g('defs'))
    svg.insert(0, defs)
    outside = ET.SubElement(defs, g('mask'), {'id': 'logo-outside', 'maskUnits': 'userSpaceOnUse',
                                              'x': '0', 'y': '0', 'width': '520', 'height': '520'})
    ET.SubElement(outside, g('rect'), x='0', y='0', width='520', height='520', fill='#fff')
    ET.SubElement(outside, g('circle'), cx=str(BODY['cx']), cy=str(BODY['cy']), r=str(BODY['r'] - 4), fill='#000')
    svg.append(fronts)
    hands = ET.SubElement(svg, g('g'), {'class': 'hands'})
    for side, (hx, hy) in (('left', HAND['left']), ('right', HAND['right'])):
        hand = ET.SubElement(hands, g('g'), {'class': f'hand hand-{side}'})
        edge = ET.SubElement(hand, g('g'), {'class': 'edge'})
        # a stubby mitt in the buddy's own line style: same fill, ink and stroke
        # weight as the body (11 * 0.883 at logo scale), squashed a touch
        ET.SubElement(edge, g('ellipse'), cx=str(hx), cy=str(hy), rx=str(HAND_RX), ry=str(HAND_RY),
                      fill='#CAECFF', stroke='#135AB6', **{'stroke-width': '9.7'})
        # soft shade along the bottom, like the body's, clipped to the mitt
        clip = ET.SubElement(edge, g('clipPath'), id=f'logo-hand-{side}')
        ET.SubElement(clip, g('ellipse'), cx=str(hx), cy=str(hy), rx=str(HAND_RX - 4), ry=str(HAND_RY - 4))
        ET.SubElement(edge, g('ellipse'), cx=str(hx), cy=str(hy + HAND_RY * 0.6), rx=str(HAND_RX), ry=str(HAND_RY * 0.55),
                      fill='#B6E3FF', **{'clip-path': f'url(#logo-hand-{side})'})
    out = ET.tostring(svg, encoding='unicode')
    open('assets/logo.svg', 'w').write(out + '\n')
    # flat idle-only copy for the PNG icons (no CSS there to pick a pose)
    flat = copy.deepcopy(svg)
    for pose in flat.find("%s[@class='backs']" % g('g')).findall(g('g')):
        if 'pose-idle' not in pose.get('class'):
            flat.find("%s[@class='backs']" % g('g')).remove(pose)
    flat.remove(flat.find("%s[@class='fronts']" % g('g')))   # cairosvg skips masks; idle has no front arms
    flat_s = ET.tostring(flat, encoding='unicode')
    import cairosvg
    for name, size in (('logo.png', 512), ('logo-192.png', 192), ('favicon.png', 64)):
        cairosvg.svg2png(bytestring=flat_s.encode(), write_to=f'assets/{name}', output_width=size, output_height=size)
        print('wrote assets/' + name, file=sys.stderr)
    print('wrote assets/logo.svg', len(out), 'bytes', file=sys.stderr)


if __name__ == '__main__':
    main()
