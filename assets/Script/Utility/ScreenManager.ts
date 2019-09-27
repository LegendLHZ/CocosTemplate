import { Dictionary } from "./Utility/Dictionary";

const {ccclass, property} = cc._decorator;

enum ScreenStateTag
{
    Storable,
    Temporary,
}

@ccclass("ScreenState")
class ScreenState
{
    @property()
    name: string = "";
    
    @property({type: cc.Enum(ScreenStateTag)})
    tag: ScreenStateTag = ScreenStateTag.Storable;
    
    @property([cc.Node])
    panels: cc.Node[] = [];

    public EnterState: Function[];
    public ExitState: Function[];

    public OnEnterState()
    {
        this.EnterState.forEach(element => {
            if(element != null)
            {
                element();
            }
        });
    }

    public OnExitState()
    {
        this.ExitState.forEach(element => {
            if(element != null)
            {
                element();
            }
        });
    }
}

class PanelItem {
    public panel: cc.Node;
    public opened: boolean;

    public get siblingIndex() {
        return this.panel.getSiblingIndex();
    }
}

class StateMemento {
    public stateList: Array<string> = [];
    public messageBox: string;

    public Reset() {
        this.stateList = [];
        this.messageBox = "";
    }

    public SetData(other: StateMemento) {
        this.Reset();
        this.stateList.concat(other.stateList);

        if (other.messageBox != null && other.messageBox != "") {
            this.messageBox = other.messageBox;
        }
    }
}

class ListStack<T>
{
    private contentList: Array<T> = [];

    public get Count(): number { return this.contentList.length; }

    public Contains(t: T): boolean {
        return this.contentList.indexOf(t) >= 0;
    }

    public Pop(): T {
        if (this.Count > 0) {
            return this.contentList.pop();
        }
        else {
            return null;
        }
    }

    public Push(t: T): void {
        this.contentList.unshift(t);
    }

    public Peek(): T {
        if (this.Count > 0) {
            return this.contentList[this.Count - 1];
        }
        else {
            return null;
        }
    }

    public Remove(t: T) {
        let index = this.contentList.indexOf(t);
        if (index >= 0) {
            this.contentList.splice(index, 1);
        }
    }

    public Clear() {
        this.contentList = [];
    }

    public ToList(): Array<T> {
        return this.contentList;
    }
}

@ccclass
export default class ScreenManager extends cc.Component
{
    @property()
    public startState: string = "";

    @property([cc.Node])
    panels: cc.Node[] = [];

    @property([ScreenState])
    screenStates: ScreenState[] = [];

    private currentState: ScreenState;
    private panelNameDictionary: Dictionary<string, cc.Node>;
    private stateDictionary: Dictionary<string, ScreenState>;
    private panelItemDictionary: Dictionary<cc.Node, PanelItem>;
    private openList: Array<PanelItem>;
    private stateStack: ListStack<string>;

    private static instance: ScreenManager;

    public static get Instance(): ScreenManager
    {
        return ScreenManager.instance;
    }

    onDestroy()
    {
        ScreenManager.instance = null;
    }

    onload()
    {
        ScreenManager.instance = this;

        let self = this;
        this.panelNameDictionary = new Dictionary<string, cc.Node>();
        this.panels.forEach(item => {
            self.panelNameDictionary.add(item.name, item);
        });

        this.panelItemDictionary = new Dictionary<cc.Node, PanelItem>();
        this.panels.forEach(panel => {
            var panelItem = new PanelItem();
            panelItem.panel = panel;
            panelItem.opened = false;
            self.panelItemDictionary.add(panel, panelItem);
        });

        this.openList = new Array<PanelItem>();
        this.stateStack = new ListStack<string>();

        // disable all panels
        this.panels.forEach(item => {
            item.active = false;
        });

        this.stateDictionary = new Dictionary<string, ScreenState>();
        this.screenStates.forEach(item => {
            self.stateDictionary.add(item.name, item);
        })

        this.ChangeState(this.startState);
    }

    private CheckPanelOpened(panel: cc.Node): boolean
    {
        var panelItem = this.GetPanelItem(panel);
        if (panelItem == null)
        {
            console.error("Invalid panel item", panelItem);
            return false;
        }

        return panelItem.opened;
    }

    private EnablePanel(panel: cc.Node, enable: boolean)
    {
        // update state
        var panelItem = this.panelItemDictionary.find(panel);
        panelItem.opened = enable;

        if (enable)
        {
            // activate panel object
            panel.active = true;

            // move to front
            panel.setSiblingIndex(panel.parent.childrenCount - 1);

            // play animation
            
        }
        else
        {
            // set animator bool
            // Animator animator = panel.GetComponent<Animator>();
            // if (animator != null && animator.enabled)
            // {
            //     animator.SetBool("Open", false);
            //     StartCoroutine(DisablePanel(panel));
            // }
            // else
            {
                // just disable it
                panel.active = false;
            }
        }
    }

    private OpenPanel(panelName: string)
    {
        var panel = this.GetPanel(panelName);
        if (panel == null)
        {
            console.error("Invalid panel name", panelName);
            return;
        }

        this.EnablePanel(panel, true);
    }

    private ClosePanelByName(panelName: string)
    {
        var panel = this.GetPanel(panelName);
        if (panel == null)
        {
            console.error("Invalid panel name", panelName);
            return;
        }

        this.EnablePanel(panel, false);
    }

    private DoChangeState(stateName: string)
    {
        let state: ScreenState = this.stateDictionary.find(stateName);
        if (state == null)
        {
            console.error("Invalid state name", stateName);
            return;
        }

        // call exit
        if (this.currentState != null)
        {
            this.currentState.OnExitState();
        }

        // set current
        this.currentState = state;

        this.RefreshOpenList();

        // check panels to open
        let self = this;
        state.panels.forEach(panel => {
            var panelItem = this.GetPanelItem(panel);
            if (this.openList.indexOf(panelItem) < 0) {
                // open new panel
                self.EnablePanel(panel, true);
            }
        });

        // check panels to close
        this.openList.forEach(item => {
            if (state.panels.indexOf(item.panel) < 0) {
                // close panel
                self.EnablePanel(item.panel, false);
            }
        });

        // call enter
        this.currentState.OnEnterState();

        // update panel sibling order
        this.currentState.panels.forEach (panel =>
        {
            // move to front
            panel.setSiblingIndex(panel.parent.childrenCount - 1);
        })
    }

    public IsPanelOpened(panelName: string): boolean
    {
        var panel = this.GetPanel(panelName);
        if (panel == null)
        {
            console.error("Invalid panel name", panelName);
            return false;
        }

        var panelItem = this.GetPanelItem(panel);
        if (panelItem == null)
        {
            console.error("Invalid panel item", panelItem);
            return false;
        }

        return panelItem.opened;
    }

    public ChangeState(stateName: string)
    {
        let lastStateName: string = null;
        if (this.stateStack.Count > 0)
        {
            // pop last from stack
            lastStateName = this.stateStack.Pop();
        }
        
        // push new state
        this.stateStack.Push(stateName);

        this.DoChangeState(stateName);
    }

    public PushState(stateName: string)
    {
        //If tag is "Temporary", don't push stack. Keep stack item don't  multiple.
        let currentMenu: string = this.stateStack.Peek();

        if (stateName != currentMenu)
        {
            let state: ScreenState = this.stateDictionary.find(currentMenu);
            if (state != null && state.tag == ScreenStateTag.Temporary)
            {
                this.stateStack.Pop();
            }

            if (this.stateStack.Contains(stateName))
            {
                this.stateStack.Remove(stateName);
            }

            // push to stack
            this.stateStack.Push(stateName);
        }

        this.DoChangeState(stateName);
    }

    public PopState()
    {
        if (this.stateStack.Count < 2)
        {
            console.log("Invalid operation. current state stack count", this.stateStack.Count);
            return;
        }

        // pop from stack
        let lastStateName: string = this.stateStack.Pop();

        // get new state
        let newStateName: string = this.stateStack.Peek();

        this.DoChangeState(newStateName);
    }

    public PeekStateName(): string
    {
        let name: string = "";
        if (this.stateStack.Count > 0)
        {
            name = this.stateStack.Peek();
        }
        return name;
    }

    public RegisterStateEvent(name: string, enter: Function, exit: Function)
    {
        let state: ScreenState = this.stateDictionary.find(name);
        if (state == null)
        {
            console.error("Unknown panel state", name);
            return;
        }

        state.EnterState.push(enter);
        state.ExitState.push(exit);
    }

    public UnregisterStateEvent(name: string, enter: Function, exit: Function)
    {
        let state = this.stateDictionary.find(name);
        if (state == null)
        {
            console.error("Unknown panel state", name);
            return;
        }

        state.EnterState.push(enter);
        state.ExitState.push(exit);
    }

    public GetPanel(name: string): cc.Node
    {
        return this.panelNameDictionary.find(name);
    }

    public GetPanelItem(panel: cc.Node): PanelItem
    {
        return this.panelItemDictionary.find(panel);
    }

    private RefreshOpenList()
    {
        this.openList = [];

        this.panelItemDictionary.Values.forEach(item => {
            if (item.opened) {
                this.openList.push(item);
            }
        });

        // sort base on sibling index
        this.openList.sort((lhs, rhs) => lhs.siblingIndex-(rhs.siblingIndex));
    }
}