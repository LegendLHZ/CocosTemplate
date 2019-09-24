import { Binding, ResetModel } from "../Binding";
import DataContext from "../DataContext";
import { BindingManager } from "../BindingManager";

const {ccclass, property, menu} = cc._decorator;

@ccclass
@menu('Binder/ComponentGetter')
export default class ComponentGetter extends cc.Component
{
    @property
    path: string = "";

    @property(cc.Component)
    target: cc.Component = null;

    private binding: Binding;
    private context: DataContext;

    start ()
    {
        this.binding = new Binding(this.path, this, "target");
        this.binding.resetModel = ResetModel.ResetSource;
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