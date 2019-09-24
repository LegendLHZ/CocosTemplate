import { Binding } from "../Binding";
import DataContext from "../DataContext";
import { BindingManager } from "../BindingManager";

const {ccclass, property, menu} = cc._decorator;

@ccclass
@menu('Binder/NodeBinder')
export default class NodeBinder extends cc.Component
{
    @property
    positionPath: string = "";

    private binding: Binding;
    private context: DataContext;

    onLoad ()
    {
        this.binding = new Binding(this.positionPath, this, "node.position");
        this.context = BindingManager.AddBinding(this.binding, this.node);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
        }
    }
}