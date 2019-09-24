
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

    public EnterState: () => {};
    public ExitState: () => {};
    public MementoState: () => {};

    public OnEnterState()
    {
        var action = this.EnterState;
        if (action != null)
        {
            action();
        }
    }

    public OnExitState()
    {
        var action = this.ExitState;
        if (action != null)
        {
            action();
        }
    }

    public OnMementoState()
    {
        var action = this.MementoState;
        if (action != null)
        {
            action();
        }
    }
}


@ccclass
export default class ScreenManager extends cc.Component
{

    @property(cc.Label)
    label: cc.Label = null;


    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

}