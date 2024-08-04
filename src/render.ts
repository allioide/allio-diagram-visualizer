import {
  Rect, Text, G, Line, Path,
  type Svg, type Element, type ArrayXY,
} from '@svgdotjs/svg.js';
import {
  type Action, type Command, type Operator, type Value, type ALLIODiagram,
  type Begin, type Transition, type BackToBegin, type End, type Condition,
  type Expression,
} from './schema/alliodiagram.js';
import {FONT_REGULAR, FONT_BOLD} from './util/font.js';

const DIAGRAM_BRANCH_VERTICAL_SPACE = 20;
const BEGIN_WIDTH = 16;
const BEGIN_HEIGHT = 32;
const BEGIN_RADIUS = 10;
const COMMAND_BOX_OFFSET = 6;
const COMMAND_BOX_ACTION_GAP = 5;
const COMMAND_BOX_RADIUS = 8;
const COMMAND_BOX_NAME_HEIGHT = 18;
const TRANSITION_LINE_WIDTH = 2;
const TRANSITION_EMPTY_LENGTH = 20;
const TRANSITION_PADDING = 10;
const TRANSITION_LINE_VGAP = 5;
const TRANSITION_CURVE_HSPACE = 30;
const GENERIC_DEVICE_NAME_BOX_OFFSET = 5;
const GENERIC_DEVICE_NAME_BOX_RADIUS = 4;
const GENERIC_DEVICE_NAME_BOX_BG_COLOR = '#E6E6E6';
const END_RADIUS = 4;

const BEGIN_COLOR = '#9F31E9';
const COMMAND_COLOR = '#00CC6A';
const CONDITION_COLOR = '#FFAB00';
const END_COLOR = '#FA2941';
const TEXT_LITERAL_COLOR = '#C75450';
const NUMBER_LITERAL_COLOR = '#2673FD';
const VALUE_COLOR = '#9F31E9';

type DiagramComponent = Command | Begin | Transition | BackToBegin | End;
type SvgJsElement = Element;

class Region {
  constructor(private topLeftOffsetX: number,
    private topLeftOffsetY: number,
    private centerOffsetY: number,
    readonly width: number,
    readonly height: number) {}

  offset(x: number, y: number): this {
    this.topLeftOffsetX += x;
    this.topLeftOffsetY += y;
    this.centerOffsetY += y;
    return this;
  }

  getTopLeftPosition(): ArrayXY {
    return [this.topLeftOffsetX, this.topLeftOffsetY];
  }

  getTopLeftOffsetX(): number {
    return this.topLeftOffsetX;
  }

  getTopLeftOffsetY(): number {
    return this.topLeftOffsetY;
  }

  getCenterOffsetY(): number {
    return this.centerOffsetY;
  }
}

function isOperator(term: Operator | Value): term is Operator {
  return (term as Operator).operator !== undefined;
}

function isCondition(term: Condition | Expression): term is Condition {
  return (term as Condition).device !== undefined;
}

function createGenericDeviceName(name: string): G {
  const deviceNameText = new Text()
    .fill('#000000')
    .font(FONT_BOLD)
    .css('dominantBaseline', 'central') // See: https://stackoverflow.com/a/31522006
    .css('textAnchor', 'middle')
    .plain(name);

  const deviceNameBbox = deviceNameText.bbox();
  const boxWidth = deviceNameBbox.width + (GENERIC_DEVICE_NAME_BOX_OFFSET * 2);
  // TODO: document why / 2
  const boxHeight = (deviceNameBbox.height / 2) + (GENERIC_DEVICE_NAME_BOX_OFFSET * 2);

  const deviceNameBg = new Rect()
    .width(boxWidth)
    .height(boxHeight)
    .radius(GENERIC_DEVICE_NAME_BOX_RADIUS, GENERIC_DEVICE_NAME_BOX_RADIUS)
    .fill(GENERIC_DEVICE_NAME_BOX_BG_COLOR)
    .x(0)
    .y(0);

  deviceNameText.move((boxWidth / 2) + deviceNameBbox.x, (boxHeight / 2) + deviceNameBbox.y);

  const g = new G();
  g.add(deviceNameBg);
  g.add(deviceNameText);
  return g;
}

function createAction(action: Action): G {
  // TODO: support multiple devices
  const deviceName = createGenericDeviceName(action.device);
  const deviceNameBbox = deviceName.bbox();

  const valueDeviceBg: Rect[] = [];
  const actionText = new Text();
  actionText.text(add => {
    add.tspan('Action: ').font(FONT_BOLD);
    add.tspan(action.action).font(FONT_REGULAR);
    if (action.parameters) {
      for (const parameter of action.parameters) {
        add.tspan(`${parameter.name}: `).font(FONT_BOLD).newLine();
        if (typeof parameter.value === 'string') {
          add.tspan(parameter.value).font(FONT_REGULAR).fill(TEXT_LITERAL_COLOR);
        } else if (typeof parameter.value === 'number') {
          add.tspan(`${parameter.value}`).font(FONT_REGULAR).fill(NUMBER_LITERAL_COLOR);
        } else { // TODO: add enum
          for (let i = 0; i < parameter.value.expression.length; i++) {
            const term = parameter.value.expression[i];
            const trailingSpace = (i === parameter.value.expression.length - 1) ? '' : ' ';
            if (typeof term === 'string') {
              add.tspan(`${term}${trailingSpace}`).font(FONT_REGULAR).fill(TEXT_LITERAL_COLOR);
            } else if (typeof term === 'number') {
              add.tspan(`${term}${trailingSpace}`).font(FONT_REGULAR).fill(NUMBER_LITERAL_COLOR);
            } else if (isOperator(term)) {
              add.tspan(`${term.operator}${trailingSpace}`).font(FONT_REGULAR);
            } else { // TODO: add operator
              const name = add.tspan(` ${term.device} `).font(FONT_REGULAR).css('whiteSpace', 'pre');
              const nameBbox = name.bbox();
              const boxWidth = nameBbox.width;
              const boxHeight = nameBbox.height;
              valueDeviceBg.push(new Rect()
                .x(nameBbox.x)
                .y(nameBbox.y)
                .width(boxWidth)
                .height(boxHeight)
                .radius(GENERIC_DEVICE_NAME_BOX_RADIUS, GENERIC_DEVICE_NAME_BOX_RADIUS)
                .fill(GENERIC_DEVICE_NAME_BOX_BG_COLOR));
              add.tspan(`.${term.value}${trailingSpace}`).font(FONT_REGULAR).fill(VALUE_COLOR);
            }
          }
        }
      }
    }
  });

  // Move action text (e.g. Action: On\n Brightness: 'Light1'.intensity) and all value device bg (e.g. 'Light1') below all devices name.
  // Note: The top-left y coordinate of the text(actionText) bounding box is at -xx.xx instead of 0. When we call actionText.move(x1, y1),
  // the library takes into account that -xx.xx and the final top-left y coordinate starts at 0. Therefore, we need to manually keep the
  // offset and use it to move the value device bg
  const yOffset = actionText.bbox().y;
  for (const r of valueDeviceBg) {
    r.dmove(GENERIC_DEVICE_NAME_BOX_OFFSET / 2, deviceNameBbox.height - yOffset);
  }

  actionText.move(GENERIC_DEVICE_NAME_BOX_OFFSET / 2, deviceNameBbox.height);

  const g = new G();
  g.add(deviceName);
  for (const r of valueDeviceBg) {
    g.add(r);
  }

  g.add(actionText);
  return g;
}

function createCommand(command: Command): G {
  const actionGroup = new G();
  let latestHeight = 0;
  for (const actionData of command.actions!) {
    const action = createAction(actionData);
    action.move(0, latestHeight);

    const actionBbox = action.bbox();
    latestHeight += actionBbox.height + COMMAND_BOX_ACTION_GAP;

    actionGroup.add(action);
  }

  const nameText = new Text();
  nameText.font(FONT_REGULAR);
  if (command.name) {
    nameText.text(command.name);
  }

  nameText.move(0, 0);

  const nameTextBbox = nameText.bbox();
  const actionGroupBbox = actionGroup.bbox();
  const borderWidth = Math.max(actionGroupBbox.width + (COMMAND_BOX_OFFSET * 2), nameTextBbox.width);
  const borderHeight = actionGroupBbox.height + (COMMAND_BOX_OFFSET * 2);
  const border = new Rect()
    .width(borderWidth)
    .height(borderHeight)
    .radius(COMMAND_BOX_RADIUS, COMMAND_BOX_RADIUS)
    .fill('#FFFFFF')
    .stroke({color: COMMAND_COLOR, width: 1});

  const g = new G();
  if (command.name) {
    g.add(nameText);
    g.add(border.translate(0, COMMAND_BOX_NAME_HEIGHT));
    g.add(actionGroup.translate(COMMAND_BOX_OFFSET, COMMAND_BOX_OFFSET + COMMAND_BOX_NAME_HEIGHT));
  } else {
    g.add(border);
    g.add(actionGroup.translate(COMMAND_BOX_OFFSET, COMMAND_BOX_OFFSET));
  }

  return g;
}

function createTransition(transition: Transition): G {
  const g = new G();
  if (transition.conditions) {
    const valueDeviceBg: Rect[] = [];
    const conditionText = new Text();
    conditionText.text(add => {
      for (let i = 0; i < transition.conditions!.length; i++) {
        const term = transition.conditions![i];
        const trailingSpace = (i === transition.conditions!.length - 1) ? '' : ' ';
        if (isCondition(term)) {
          const name = add.tspan(` ${term.device} `).font(FONT_REGULAR).css('whiteSpace', 'pre');
          const nameBbox = name.bbox();
          const boxWidth = nameBbox.width;
          const boxHeight = nameBbox.height;
          valueDeviceBg.push(new Rect()
            .x(nameBbox.x)
            .y(nameBbox.y)
            .width(boxWidth)
            .height(boxHeight)
            .radius(GENERIC_DEVICE_NAME_BOX_RADIUS, GENERIC_DEVICE_NAME_BOX_RADIUS)
            .fill(GENERIC_DEVICE_NAME_BOX_BG_COLOR));
          // TODO: support parameter
          add.tspan('.').font(FONT_REGULAR);
          add.tspan(`${term.condition}`).font(FONT_REGULAR).fill(CONDITION_COLOR);
          add.tspan(`()${trailingSpace}`).font(FONT_REGULAR);
        }
        // TODO: support expression
        // TODO: multiple condition
      }
    });
    const yOffset = conditionText.bbox().y;
    for (const r of valueDeviceBg) {
      r.dmove(0, -yOffset);
    }

    conditionText.move(0, 0);

    for (const r of valueDeviceBg) {
      g.add(r);
    }

    g.add(conditionText);
  }

  return g;
}

function createBegin(begin: Begin): Path {
  const p = new Path();
  p.plot(`M 0 0 L 0 ${BEGIN_HEIGHT} L ${BEGIN_WIDTH} ${BEGIN_HEIGHT / 2} Z`);
  p.fill(BEGIN_COLOR);
  return p;
}

function createBackToBegin(backToBegin: BackToBegin): Path {
  const p = new Path();
  p.plot(`M 0 ${BEGIN_HEIGHT / 2} L ${BEGIN_WIDTH} ${BEGIN_HEIGHT} L ${BEGIN_WIDTH} 0 Z`);
  p.fill(BEGIN_COLOR);
  return p;
}

function createEnd(end: End): Rect {
  return new Rect()
    .width(20)
    .height(20)
    .radius(END_RADIUS, END_RADIUS)
    .fill(END_COLOR);
}

function getRootElement(content: DiagramComponent[]): Begin {
  const begins = content.filter(element => element.type === 'begin');
  if (begins.length === 0) {
    throw new Error('Missing begin block');
  }

  if (begins.length !== 1) {
    throw new Error('Found multiple begin blocks');
  }

  return begins[0];
}

function getAllTransitions(content: DiagramComponent[]): Transition[] {
  return content.filter(element => element.type === 'transition');
}

function buildComponentMap(content: DiagramComponent[]): Map<string, DiagramComponent> {
  const elementMap = new Map<string, DiagramComponent>();
  for (const element of content) {
    if (element.id) {
      elementMap.set(element.id, element);
    }
  }

  return elementMap;
}

function buildTransitionMap(content: DiagramComponent[], elementMap: Map<string, DiagramComponent>): Map<DiagramComponent, Set<DiagramComponent>> {
  const transitionMap = new Map<DiagramComponent, Set<DiagramComponent>>();
  for (const element of content) {
    transitionMap.set(element, new Set());
  }

  const transitions = content.filter(element => element.type === 'transition');
  for (const transition of transitions) {
    const source = elementMap.get(transition.from);
    if (!source) {
      throw new Error('Missing source');
    }

    const destination = elementMap.get(transition.to);
    if (!destination) {
      throw new Error('Missing destination');
    }

    transitionMap.get(source)!.add(transition);
    transitionMap.get(transition)!.add(destination);
  }

  return transitionMap;
}

function generateComponentOrder(root: Begin, transitionMap: Map<DiagramComponent, Set<DiagramComponent>>): DiagramComponent[] {
  const elementOrder: DiagramComponent[] = [];
  const queue: DiagramComponent[] = [root];
  while (queue.length > 0) {
    const current = queue.shift()!;
    elementOrder.push(current);
    const next = transitionMap.get(current);
    if (next) {
      if (next.size === 0) {
        if (current.type !== 'end' && current.type !== 'back to begin') {
          throw new Error('Diagram should end with end or back to begin');
        }
      } else {
        queue.unshift(...next);
      }
    } else {
      throw new Error('Missing transition map');
    }
  }

  return elementOrder;
}

function createComponent(component: DiagramComponent): SvgJsElement {
  let svg: SvgJsElement;
  // TODO: implement subdiagram, end
  switch (component.type) {
    case 'begin': {
      svg = createBegin(component);
      break;
    }

    case 'command': {
      svg = createCommand(component);
      break;
    }

    case 'transition': {
      svg = createTransition(component);
      break;
    }

    case 'back to begin': {
      svg = createBackToBegin(component);
      break;
    }

    case 'end': {
      svg = createEnd(component);
      break;
    }
  }

  return svg;
}

function getComponentSize(component: DiagramComponent, element: SvgJsElement) {
  const bbox = element.bbox();
  const width = (component.type === 'transition') ? (component.conditions ? bbox.width + (TRANSITION_PADDING * 2) : TRANSITION_EMPTY_LENGTH) : bbox.width;
  const height = (component.type === 'transition') ? bbox.height + TRANSITION_LINE_VGAP : bbox.height;
  return [width, height];
}

function getCenterPosition(component: DiagramComponent, element: SvgJsElement) {
  const bbox = element.bbox();
  if (component.type === 'command') {
    return (bbox.height + COMMAND_BOX_NAME_HEIGHT) / 2;
  }

  if (component.type === 'transition') {
    return bbox.height + TRANSITION_LINE_VGAP;
  }

  return bbox.height / 2;
}

function getInputPortPosition(component: DiagramComponent, element: SvgJsElement, topLeftPos: ArrayXY): ArrayXY {
  const centerY = getCenterPosition(component, element);
  return [topLeftPos[0], topLeftPos[1] + centerY];
}

function getOutputPortPosition(component: DiagramComponent, element: SvgJsElement, topLeftPos: ArrayXY): ArrayXY {
  const bbox = element.bbox();
  const centerY = getCenterPosition(component, element);
  return [topLeftPos[0] + bbox.width, topLeftPos[1] + centerY];
}

export function renderSvg(file: ALLIODiagram, canvas: Svg): string {
  for (const diagram of file.diagrams) {
    const root = getRootElement(diagram.content);
    const elementMap = buildComponentMap(diagram.content);
    const transitionMap = buildTransitionMap(diagram.content, elementMap);

    const componentToSvgMap = new Map<DiagramComponent, SvgJsElement>();
    for (const element of diagram.content) {
      componentToSvgMap.set(element, createComponent(element));
    }

    const elementOrder = generateComponentOrder(root, transitionMap);
    elementOrder.reverse();

    const componentRegionMap = new Map<DiagramComponent, Region>();
    for (const currentElement of elementOrder) {
      const [currentElementWidth, currentElementHeight] = getComponentSize(currentElement, componentToSvgMap.get(currentElement)!);
      const currentElementCenterY = getCenterPosition(currentElement, componentToSvgMap.get(currentElement)!);
      const childrenElement = transitionMap.get(currentElement)!;
      if (childrenElement.size === 0) {
        componentRegionMap.set(currentElement, new Region(0, 0, currentElementCenterY, currentElementWidth, currentElementHeight));
      } else {
        const childrenRegions = [...childrenElement].map(element => componentRegionMap.get(element)!);

        // Layout all children vertically
        const additionalHSpace = (childrenElement.size > 1) ? TRANSITION_CURVE_HSPACE : 0;
        let currentY = 0;
        for (const region of childrenRegions) {
          region.offset(currentElementWidth + additionalHSpace, currentY);
          currentY += region.height + DIAGRAM_BRANCH_VERTICAL_SPACE;
        }

        // Layout parent to center vertically among all children
        const totalChildHeight = childrenRegions.map(element => element.height).reduce((a, b) => a + b, 0) + (DIAGRAM_BRANCH_VERTICAL_SPACE * (childrenElement.size - 1));
        const currentElementCenterYRelativeToChildren = (childrenRegions[0].getCenterOffsetY() + childrenRegions.at(-1)!.getCenterOffsetY()) / 2;
        const currentElementTopYRelativeToChildren = currentElementCenterYRelativeToChildren - currentElementCenterY;

        // Move children based on parent location
        for (const region of childrenRegions) {
          region.offset(0, -currentElementTopYRelativeToChildren);
        }

        // Update region from parent to leaf node
        const currentElementNewTopY = Math.max(0, currentElementTopYRelativeToChildren);
        const currentElementNewCenterY = currentElementNewTopY + currentElementCenterY;
        const totalWidth = currentElementWidth + additionalHSpace + Math.max(...childrenRegions.map(element => element.width));
        const totalHeight = Math.max(currentElementHeight + currentElementNewTopY, totalChildHeight); // TODO: total child height should take into account topLeftY of top most child
        componentRegionMap.set(currentElement, new Region(0, currentElementNewTopY, currentElementNewCenterY, totalWidth, totalHeight));
      }
    }

    const g = new G();
    const queue: DiagramComponent[] = [root];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const svg = componentToSvgMap.get(current)!;
      const region = componentRegionMap.get(current)!;
      svg.translate(((current.type === 'transition') ? region.getTopLeftOffsetX() + TRANSITION_PADDING : region.getTopLeftOffsetX()), region.getTopLeftOffsetY());
      g.add(svg);

      for (const child of transitionMap.get(current)!) {
        componentRegionMap.get(child)!.offset(region.getTopLeftOffsetX(), region.getTopLeftOffsetY());
        queue.push(child);
      }
    }

    for (const transition of getAllTransitions(diagram.content)) {
      const sourceComponent = elementMap.get(transition.from)!;
      const sourcePortPos = getOutputPortPosition(sourceComponent, componentToSvgMap.get(sourceComponent)!,
        componentRegionMap.get(sourceComponent)!.getTopLeftPosition());
      const destinationComponent = elementMap.get(transition.to)!;
      const destinationPortPos = getInputPortPosition(destinationComponent, componentToSvgMap.get(destinationComponent)!,
        componentRegionMap.get(destinationComponent)!.getTopLeftPosition());

      if (Math.abs(sourcePortPos[1] - destinationPortPos[1]) < 0.001) {
        g.add(new Line().plot([sourcePortPos, destinationPortPos])
          .stroke({width: TRANSITION_LINE_WIDTH, color: CONDITION_COLOR}));
      } else {
        const cx = sourcePortPos[0] + TRANSITION_CURVE_HSPACE + TRANSITION_PADDING;
        g.add(new Path().plot(`M ${sourcePortPos[0]} ${sourcePortPos[1]} `
                            + `C ${cx} ${sourcePortPos[1]} ${sourcePortPos[0]} ${destinationPortPos[1]} ${cx} ${destinationPortPos[1]} `
                            + `L ${destinationPortPos[0]} ${destinationPortPos[1]}`)
          .fill({color: 'none'})
          .stroke({width: TRANSITION_LINE_WIDTH, color: CONDITION_COLOR}));
      }
    }

    canvas.add(g);
  }

  const bbox = canvas.bbox();
  canvas.viewbox(0, 0, bbox.width, bbox.height);
  canvas.size(bbox.width, bbox.height);
  return canvas.svg();
}
