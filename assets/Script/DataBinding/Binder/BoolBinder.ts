import { Binding } from "../Binding";
import DataContext from "../DataContext";
import { BindingManager } from "../BindingManager";

const {ccclass, property, menu} = cc._decorator;

@ccclass
@menu('Binder/BoolBinder')
export default class BoolBinder extends cc.Component
{
    @property
    path: string = "";

    @property
    inverse: boolean = false;

    @property([cc.Node])
    targets: cc.Node[] = [];

    @property([cc.Node])
    inverseTargets: cc.Node[] = [];

    public set IsEnable(v : boolean)
    {
        let flag: boolean = this.inverse ? (!v) : v;

        var self = this;
        this.targets.forEach(element => {
            self.SetNodeActive(element, flag);
        });

        this.inverseTargets.forEach(element => {
            self.SetNodeActive(element, !flag);
        });
    }

    private binding: Binding;
    private context: DataContext;

    start ()
    {
        this.binding = new Binding(this.path, this, "IsEnable");
        this.context = BindingManager.AddBinding(this.binding, this.node);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
        }
    }

    private SetNodeActive(node: cc.Node, value: boolean)
    {
        if(node != null && node.active != value)
        {
            node.active = value;
        }
    }
}