import { BindingManager } from "./BindingManager";
import { Binding } from "./Binding";

const {ccclass, property, menu, disallowMultiple} = cc._decorator;

@ccclass
@disallowMultiple
@menu('DataBinding/DataContext')
export default class DataContext extends cc.Component
{
    @property
    sourceName: string = "";

    private bindingList: Array<Binding> = [];

    public get IsBound() : boolean
    {
        return this.source != null;
    }

    private source: object;

    onLoad()
    {
        if(this.sourceName != null && this.sourceName != "")
        {
            BindingManager.Instance.AddDataContext(this.sourceName, this);
        }
    }

    onDestroy()
    {
        if(this.sourceName != null && this.sourceName != "")
        {
            BindingManager.Instance.RemoveDataContext(this);
        }
    }

    public SetSource(source: object)
    {
        if(source == null)
        {
            console.error("The source is null.");
            return;
        }

        if(this.IsBound)
        {
            this.RemoveSource();
        }

        this.source = source;

        this.bindingList.forEach(item => {
            item.Bind(source);
        });
    }

    public RemoveSource()
    {
        if(this.source == null)
        {
            return;
        }

        this.source = null;

        this.bindingList.forEach(item => {
            item.UnBind();
        });
    }

    public AddBinding(binding: Binding)
    {
        if (binding == null)
        {
            return;
        }

        if(this.bindingList.indexOf(binding) >= 0)
        {
            console.error("Binding is already added -> ", binding);
            return;
        }

        this.bindingList.push(binding);

        if(this.IsBound)
        {
            binding.Bind(this.source);
        }
    }

    public RemoveBindings(bindings: Array<Binding>)
    {
        if(bindings == null || bindings.length == 0)
        {
            return;
        }
        
        var self = this;
        bindings.forEach(element => {
            self.RemoveBinding(element);
        });
    }

    public RemoveBinding(binding: Binding)
    {
        if (binding == null)
        {
            return;
        }

        if(this.bindingList == null)
        {
            return;
        }

        let index = this.bindingList.indexOf(binding);
        if(index < 0)
        {
            console.warn("Unknown binding -> ", binding);
            return;
        }

        this.bindingList.splice(index, 1);

        if(this.IsBound)
        {
            binding.UnBind();
        }
    }
}