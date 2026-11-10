import {reportSpecs} from "../../src/modules/reporting/catalogue";
import type {Shape} from "../../src/modules/reporting/shape";
import type {StoredReport} from "../../src/modules/reporting/service";
import type {Json} from "../../src/lib/json";
function sample(s:Shape):Json {
  if(s.kind==="array")return [];
  if(s.kind==="map")return {};
  if(s.kind==="object")return Object.fromEntries(Object.entries(s.fields!).filter(([,v])=>!v.optional).map(([k,v])=>[k,sample(v)]));
  if(s.nullable)return null;
  return s.enum?.[0]??(s.kind==="number"?0:s.kind==="boolean"?false:"");
}
export function fixture():StoredReport[] {
  return [
    {key:"certrace:workspaces",revision:1,value:[{...sample(reportSpecs["certrace:workspaces"]!.item!) as object,id:"ws",installationId:"plant",installationName:"Plant",productId:"steel",cnCode:"72083900",year:2026,periodStart:"2026-01-01",periodEnd:"2026-12-31",productName:"Steel",supplierName:"Operator",selfSupplied:true}]},
    {key:"certrace:installations",revision:1,value:[{...sample(reportSpecs["certrace:installations"]!.item!) as object,id:"plant",name:"Plant",self:true}]},
    {key:"certrace:workspace-mmd-draft",revision:1,value:{ws:{...sample(reportSpecs["certrace:workspace-mmd-draft"]!.item!) as object,inputPlan:{operatorName:"Operator",operatorRegistration:"",operatorAddress:"",registryId:"",monitoringStart:"2026-01-01",additionalFlows:[],processes:[{id:"p1",name:"Melting",routes:[],steps:[],products:[{id:"g1",name:"Steel",cnCode:"72083900",description:"",unit:"t",benchmark:""}],precursorIds:[],otherInputs:[]}]}}}},
    {key:"certrace:precursor-suppliers",revision:1,value:{ws:[{...sample(reportSpecs["certrace:precursor-suppliers"]!.item!.item!) as object,id:"s1",workspaceId:"ws",name:"Supplier"}]}},
  ];
}
