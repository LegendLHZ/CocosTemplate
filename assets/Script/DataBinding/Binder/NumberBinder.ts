import { Binding } from "../Binding";
import DataContext from "../DataContext";
import { BindingManager } from "../BindingManager";

const {ccclass, property, menu} = cc._decorator;

@ccclass("Config")
class Config
{
    @property()
    value: number = 0;

    @property([cc.Node])
    targets: cc.Node[] = [];
}

enum TestFunction
{
    Never,
    Less,
    LessEqual,
    Greater,
    GreaterEqual,
    Equal,
    NotEqual,
    Always,
}

@ccclass
@menu('Binder/NumberBinder')
export default class NumberBinder extends cc.Component
{
    @property
    path: string = "";

    @property({ type: cc.Enum(TestFunction) })
    testFunction: TestFunction = TestFunction.Equal;
    
    @property([Config])
    configs: Config[] = [];

    public set IntValue(v : number)
    {
        var self = this;
        this.configs.forEach(config => {
            let flag = self.TestValue(config.value, v);
            config.targets.forEach(item => {
                if(item.active != flag)
                {
                    item.active = flag;
                }
            });
        });
    }

    private binding: Binding;
    private context: DataContext;

    start ()
    {
        this.binding = new Binding(this.path, this, "IntValue");
        this.context = BindingManager.AddBinding(this.binding, this.node);
    }

    onDestroy()
    {
        if(this.context != null && this.binding != null)
        {
            this.context.RemoveBinding(this.binding);
        }
    }

    private TestValue(lhs: number, rhs: number): boolean
    {
        switch (this.testFunction)
        {
            case TestFunction.Never:
                return false;

            case TestFunction.Less:
                return lhs < rhs;

            case TestFunction.LessEqual:
                return lhs <= rhs;

            case TestFunction.Greater:
                return lhs > rhs;

            case TestFunction.GreaterEqual:
                return lhs >= rhs;

            case TestFunction.Equal:
                return lhs == rhs;

            case TestFunction.NotEqual:
                return lhs != rhs;

            case TestFunction.Always:
                return true;

            default:
                return false;
        }
    }
}