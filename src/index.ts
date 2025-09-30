import "./siyuan-block-attr/index.css";

import { Dialog, Plugin } from "siyuan";
import SettingPannel from "@/setting.svelte";
import { settings } from "./settings";
import doOnPaste from "./siyuan-auto-link-title";
import HrefToRef from "./siyuan-href-to-ref";
import RandomImage from "./siyuan-random/randomImage";
import RandomNote from "./siyuan-random/randomNote";
import SendTo from "./siyuan-send-to";
import TypographyGo from "./siyuan-typography-go";
import DockLeft from "./siyuan-dockLeft";
import { setPlugin } from "./utils";
import Memo from "./siyuan-memo";
import Read from "./siyuan-read";
import Bookmark from "./siyuan-bookmark";
import DockShowAndHide from "./siyuan-dock/DockShowAndHide";
import AdjustTitleLevel from "./siyuan-adjust-title-level";
import InsertCSS from "./siyuan-code-snippets/insertCSS";
import VoiceNotesPlugin from "./siyuan-voicenotes-sync/index";
import ShowCustomPropertiesUnderTitle from "./siyuan-custom-properties/index";
import ReadHelper from "./siyuan-read-helper/index";
import MobileHelper from "./siyuan-mobile-helper/index";
import { loadSlash } from "./slash";
import { loadSlashOfCreateDailyNote } from "./slash/createDailyNote";
import { quickNoteOnload } from "./quick/quickNote";
import { registerPlugin } from "@frostime/siyuan-plugin-kits";
import BlockAttr from "./siyuan-block-attr";
export default class PluginGo extends Plugin {
  myIcon = `<svg t="1714136093972" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4789" width="128" height="128"><path d="M365.745371 109.714286c0 60.598857 40.96 109.714286 91.428572 109.714285S548.602514 170.313143 548.602514 109.714286s-40.96-109.714286-91.428571-109.714286S365.745371 49.115429 365.745371 109.714286z" fill="#E3EFA7" p-id="4790"></path><path d="M457.173943 219.428571C406.705371 219.428571 365.745371 170.24 365.745371 109.714286s40.96-109.714286 91.428572-109.714286S548.602514 49.188571 548.602514 109.714286s-40.96 109.714286-91.428571 109.714285z m0-212.918857c-46.482286 0-84.370286 46.336-84.370286 103.204572 0 56.868571 37.888 103.204571 84.370286 103.204571S541.544229 166.582857 541.544229 109.714286c0-56.868571-37.888-103.204571-84.370286-103.204572z" fill="#000000" p-id="4791"></path><path d="M561.914514 140.288c-26.221714 55.808-12.544 120.137143 30.610286 143.652571 43.154286 23.515429 99.364571-2.669714 125.622857-58.514285 26.221714-55.808 12.544-120.137143-30.610286-143.652572-43.154286-23.515429-99.364571 2.669714-125.622857 58.514286z" fill="#E3EFA7" p-id="4792"></path><path d="M642.554514 292.571429c-14.628571 0-28.379429-2.962286-41.069714-8.777143-51.675429-23.515429-68.388571-88.137143-37.046857-143.725715C587.295086 99.364571 630.303086 73.142857 673.9328 73.142857c14.628571 0 28.379429 2.962286 41.069714 8.777143 25.234286 11.410286 42.861714 32.804571 49.883429 60.16 6.875429 27.062857 2.377143 56.795429-12.690286 83.748571C729.192229 266.276571 686.184229 292.571429 642.554514 292.571429z m31.232-212.699429c-40.96 0-81.261714 24.758857-102.765714 63.268571-29.44 52.370286-14.189714 112.822857 33.755429 134.765715 11.629714 5.229714 24.32 7.936 37.778285 7.936 40.96 0 81.261714-24.758857 102.765715-63.268572 14.336-25.453714 18.651429-53.577143 12.068571-79.177143a81.737143 81.737143 0 0 0-45.824-55.588571 91.282286 91.282286 0 0 0-37.778286-7.936z" fill="#000000" p-id="4793"></path><path d="M705.859657 222.72c-44.288 41.691429-60.525714 98.596571-36.315428 127.049143 24.246857 28.489143 79.798857 17.773714 124.086857-23.917714 44.288-41.691429 60.525714-98.596571 36.315428-127.049143-24.246857-28.489143-79.798857-17.773714-124.086857 23.917714z" fill="#E3EFA7" p-id="4794"></path><path d="M709.736229 365.714286c-16.822857 0-30.537143-5.741714-39.716572-16.457143-12.068571-14.153143-14.884571-35.401143-8.045714-59.611429 6.765714-23.661714 22.198857-47.725714 43.337143-67.474285C731.386514 197.558857 763.093943 182.857143 789.864229 182.857143c16.822857 0 30.537143 5.741714 39.716571 16.457143 24.576 28.708571 8.777143 85.796571-35.254857 127.268571C768.031086 350.976 736.506514 365.714286 709.736229 365.714286z m79.981714-176.164572c-25.344 0-55.259429 14.043429-80.347429 37.558857-20.260571 18.980571-34.889143 41.947429-41.398857 64.402286-6.217143 21.942857-3.949714 40.923429 6.619429 53.357714 8.045714 9.362286 20.114286 14.262857 35.035428 14.262858 25.344 0 55.259429-14.006857 80.347429-37.522286 41.398857-38.912 56.941714-91.684571 34.742857-117.76-7.862857-9.508571-19.968-14.299429-34.998857-14.299429z" fill="#000000" p-id="4795"></path><path d="M829.178514 332.141714c-60.233143 11.410286-103.68 52.077714-97.060571 90.806857 6.656 38.765714 60.854857 60.891429 121.051428 49.481143 60.233143-11.410286 103.68-52.077714 97.060572-90.806857-6.656-38.765714-60.854857-60.891429-121.051429-49.481143z" fill="#E3EFA7" p-id="4796"></path><path d="M822.4128 475.428571c-48.493714 0-84.845714-21.248-90.258286-52.845714-6.729143-38.838857 36.608-79.396571 96.841143-90.587428A172.251429 172.251429 0 0 1 859.935086 329.142857c48.493714 0 84.845714 21.248 90.258285 52.845714 6.729143 38.838857-36.608 79.396571-96.841142 90.587429a170.057143 170.057143 0 0 1-30.939429 2.852571z m37.522286-139.629714c-9.728 0-19.894857 0.987429-29.769143 2.889143-56.502857 10.459429-97.645714 47.652571-91.428572 82.651429 4.864 27.794286 39.277714 47.286857 83.785143 47.286857 9.764571 0 19.894857-0.950857 29.769143-2.852572 56.539429-10.496 97.645714-47.689143 91.428572-82.688-4.864-27.794286-39.387429-47.286857-83.748572-47.286857z" fill="#000000" p-id="4797"></path><path d="M836.785371 475.830857c-60.525714 4.315429-107.666286 40.338286-105.252571 80.493714 2.450286 40.192 53.467429 69.266286 114.029714 64.987429 60.525714-4.315429 107.666286-40.338286 105.252572-80.493714-2.450286-40.192-53.467429-69.266286-114.029715-64.987429z" fill="#E3EFA7" p-id="4798"></path><path d="M834.005943 621.714286c-56.064 0-100.205714-28.233143-102.436572-65.462857-2.486857-40.228571 44.653714-76.251429 105.179429-80.420572 3.913143-0.256 7.826286-0.402286 11.593143-0.402286 56.064 0 100.205714 28.233143 102.436571 65.462858 2.486857 40.228571-44.653714 76.251429-105.179428 80.420571-3.766857 0.256-7.68 0.402286-11.593143 0.402286z m14.336-139.337143c-3.657143 0-7.424 0.146286-11.227429 0.438857-56.832 3.876571-101.266286 36.681143-99.035428 72.996571 1.060571 15.981714 11.227429 30.866286 28.745143 41.691429 17.92 11.154286 41.691429 17.261714 67.291428 17.261714 3.657143 0 7.460571-0.146286 11.227429-0.438857 56.832-3.876571 101.302857-36.681143 99.035428-72.996571-1.024-15.981714-11.227429-30.866286-28.745143-41.837715-17.92-10.971429-41.801143-17.115429-67.291428-17.115428z" fill="#000000" p-id="4799"></path><path d="M859.715657 621.714286c-50.468571-0.219429-91.538286 24.137143-91.684571 54.454857-0.146286 30.281143 40.667429 55.04 91.172571 55.259428 50.468571 0.219429 91.538286-24.137143 91.684572-54.454857 0.146286-30.281143-40.667429-55.04-91.172572-55.259428z" fill="#E3EFA7" p-id="4800"></path><path d="M859.971657 731.428571h-0.621714c-24.137143-0.109714-46.994286-5.778286-64.073143-15.872-17.554286-10.459429-27.245714-24.429714-27.245714-39.350857 0.109714-14.774857 9.801143-28.635429 27.392-38.985143 17.078857-9.984 39.68-15.506286 63.634285-15.506285h0.658286c50.468571 0.256 91.428571 25.014857 91.172572 55.222857-0.109714 14.774857-9.801143 28.635429-27.392 38.985143-16.822857 9.984-39.424 15.506286-63.524572 15.506285z m-0.731428-103.570285c-46.628571 0-84.662857 21.76-84.809143 48.457143 0 12.8 8.557714 24.905143 24.246857 34.194285 16.201143 9.618286 37.814857 14.921143 60.781714 14.994286h0.621714c46.592 0 84.662857-21.76 84.772572-48.457143 0.146286-26.953143-38.034286-48.969143-85.028572-49.188571h-0.621714z" fill="#000000" p-id="4801"></path><path d="M839.125943 736.438857c-49.188571 14.701714-80.018286 57.088-68.754286 94.72 11.190857 37.632 60.196571 56.210286 109.421714 41.545143 49.188571-14.701714 80.018286-57.088 68.754286-94.72-11.190857-37.632-60.196571-56.210286-109.421714-41.545143z" fill="#E3EFA7" p-id="4802"></path><path d="M846.513371 877.714286c-37.632 0-67.584-18.322286-76.141714-46.811429-11.337143-37.668571 19.382857-80.018286 68.498286-94.537143 11.081143-3.291429 22.308571-4.937143 33.536-4.937143 37.632 0 67.584 18.322286 76.141714 46.811429 11.337143 37.668571-19.382857 80.018286-68.498286 94.537143a123.062857 123.062857 0 0 1-33.536 4.937143z m25.892572-140.068572c-10.605714 0-21.174857 1.462857-31.634286 4.644572-45.787429 13.531429-74.459429 52.48-64.256 86.747428 7.789714 25.673143 35.181714 42.349714 69.997714 42.349715 10.605714 0 21.174857-1.499429 31.634286-4.681143 45.787429-13.531429 74.459429-52.48 64.256-86.710857-7.789714-25.673143-35.181714-42.386286-69.997714-42.386286z" fill="#000000" p-id="4803"></path><path d="M947.925943 851.894857c-27.940571 17.993143-41.033143 52.370286-29.293714 76.726857 11.702857 24.356571 43.885714 29.513143 71.789714 11.483429 27.940571-17.993143 41.033143-52.370286 29.293714-76.726857-11.702857-24.356571-43.885714-29.513143-71.789714-11.483429z" fill="#E3EFA7" p-id="4804"></path><path d="M956.922514 950.857143c-17.042286 0-31.341714-8.411429-38.180571-22.674286-11.922286-24.502857 1.060571-58.770286 28.891428-76.507428 10.752-6.948571 22.418286-10.532571 33.682286-10.532572 17.078857 0 31.378286 8.411429 38.180572 22.674286 5.924571 12.068571 6.034286 26.770286 0.365714 41.325714-5.485714 14.299429-15.835429 26.770286-29.074286 35.328a63.926857 63.926857 0 0 1-33.865143 10.386286z m24.393143-102.034286c-10.24 0-20.699429 3.291429-30.537143 9.435429-24.685714 15.798857-36.498286 45.568-26.258285 66.304 5.778286 11.849143 17.700571 18.797714 32.548571 18.797714 10.24 0 20.736-3.291429 30.573714-9.508571 12.068571-7.643429 21.357714-18.907429 26.331429-31.707429 4.754286-12.288 4.754286-24.612571-0.109714-34.56-5.888-11.995429-17.700571-18.761143-32.548572-18.761143z" fill="#000000" p-id="4805"></path><path d="M50.975086 768l-14.153143 64.512c-0.950857 4.388571 1.389714 8.630857 4.571428 8.630857H109.745371l-58.770285-73.142857z" fill="#90C380" p-id="4806"></path><path d="M109.745371 841.142857H10.161371a10.276571 10.276571 0 0 1-8.155428-3.803428 8.557714 8.557714 0 0 1-1.536-8.301715L20.730514 768 109.745371 841.142857zM24.424229 780.653714l-16.713143 50.468572a1.828571 1.828571 0 0 0 0.292571 2.011428 2.706286 2.706286 0 0 0 2.011429 0.987429h79.469714L24.424229 780.653714zM323.944229 950.857143l5.229714 3.108571L297.832229 1024 292.602514 1020.891429z" fill="#000000" p-id="4807"></path><path d="M1014.266514 933.339429c-36.059429-31.122286-63.195429-67.949714-133.705143-103.606858a28.196571 28.196571 0 0 1-12.8-37.12c30.610286-65.206857 41.069714-142.665143 41.069715-225.828571C908.831086 334.555429 705.493943 146.285714 454.504229 146.285714S0.031086 334.701714 0.031086 566.930286C0.031086 799.158857 75.587657 987.428571 454.357943 987.428571c10.788571 0 21.394286-0.146286 31.744-0.438857l510.354286-4.096c25.6 0 37.339429-32.585143 17.810285-49.554285z" fill="#90C380" p-id="4808"></path><path d="M454.650514 987.428571c-176.128 0-296.886857-40.301714-369.188571-123.318857C27.093943 797.257143 0.031086 702.829714 0.031086 566.857143c0-112.457143 47.36-218.112 133.339428-297.545143C219.203657 189.915429 333.306514 146.285714 454.7968 146.285714s235.593143 43.776 321.426286 123.026286c85.979429 79.433143 133.339429 185.051429 133.339428 297.545143 0 92.598857-13.421714 166.4-41.069714 225.353143a24.539429 24.539429 0 0 0 10.971429 32.036571c53.028571 26.806857 82.139429 54.637714 107.812571 79.286857 8.704 8.411429 16.969143 16.201143 25.819429 23.881143 9.984 8.704 13.531429 22.308571 8.96 34.925714a30.756571 30.756571 0 0 1-29.074286 20.736l-506.953143 4.059429c-10.715429 0.146286-21.248 0.292571-31.378286 0.292571z m0-834.048C207.793371 153.380571 7.162514 338.761143 7.162514 566.710857c0 204.361143 53.174857 413.330286 447.488 413.330286 10.24 0 20.845714-0.146286 31.378286-0.438857l5.12-0.146286v0.146286l501.540571-3.913143a23.771429 23.771429 0 0 0 22.528-15.945143 23.990857 23.990857 0 0 0-6.948571-26.806857c-9.033143-7.68-17.298286-15.652571-26.112-24.210286-26.550857-25.490286-53.906286-51.748571-106.130286-78.116571a31.670857 31.670857 0 0 1-14.262857-41.581715c27.245714-57.965714 40.521143-130.706286 40.521143-222.317714-0.146286-227.84-200.923429-413.330286-447.634286-413.330286z" fill="#000000" p-id="4809"></path><path d="M219.459657 420.571429c0 30.281143 16.384 54.857143 36.571429 54.857142s36.571429-24.576 36.571428-54.857142S276.218514 365.714286 256.031086 365.714286s-36.571429 24.576-36.571429 54.857143zM585.173943 420.571429c0 30.281143 16.384 54.857143 36.571428 54.857142s36.571429-24.576 36.571429-54.857142-16.384-54.857143-36.571429-54.857143-36.571429 24.576-36.571428 54.857143z" fill="#000000" p-id="4810"></path><path d="M109.745371 585.142857c0 20.187429 40.96 36.571429 91.428572 36.571429S292.602514 605.330286 292.602514 585.142857s-40.96-36.571429-91.428571-36.571428-91.428571 16.384-91.428572 36.571428zM621.745371 585.142857c0 20.187429 40.96 36.571429 91.428572 36.571429s91.428571-16.384 91.428571-36.571429-40.96-36.571429-91.428571-36.571428-91.428571 16.384-91.428572 36.571428z" fill="#BCD9A1" p-id="4811"></path><path d="M757.864229 841.142857a10.020571 10.020571 0 0 1-6.692572-2.669714L694.888229 785.956571l4.169142-4.937142 56.283429 52.553142c1.755429 1.572571 3.657143 0.914286 4.169143 0.658286a3.986286 3.986286 0 0 0 2.194286-3.876571l-3.584-61.952 6.326857-0.402286 3.547428 61.988571a10.605714 10.605714 0 0 1-5.668571 10.24 12.617143 12.617143 0 0 1-4.461714 0.914286zM618.197943 987.428571h7.094857v36.571429h-7.094857z" fill="#000000" p-id="4812"></path><path d="M381.361371 621.714286c-38.765714 32.987429 1.572571 101.961143 46.189715 30.244571-3.181714 37.924571 76.909714 60.233143 69.595428-16.018286l163.254857 149.211429 58.953143 54.016c4.900571 4.534857 12.470857 0.731429 12.068572-5.997714l-3.693715-63.780572" fill="#90C380" p-id="4813"></path><path d="M437.791086 694.857143c-8.301714 0-16.969143-2.377143-24.868572-7.168-9.216-5.632-15.36-13.531429-17.627428-22.235429-18.358857 24.868571-34.230857 26.88-42.349715 25.6-10.532571-1.536-19.053714-9.984-22.308571-22.089143-4.608-16.713143 1.828571-35.291429 16.274286-47.250285l4.498285 5.485714c-14.994286 12.507429-16.969143 29.403429-14.043428 39.936 2.669714 9.435429 8.850286 15.762286 16.713143 16.896 12.434286 1.828571 27.318857-9.289143 40.96-30.537143l7.68-11.958857-1.243429 14.226286c-0.841143 9.837714 4.900571 19.382857 15.250286 25.746285 12.068571 7.424 26.953143 8.155429 37.046857 1.828572 11.483429-7.204571 16.384-22.528 14.153143-44.178286l6.985143-0.731428c3.108571 30.976-7.826286 44.763429-17.517715 50.834285a33.792 33.792 0 0 1-19.602285 5.595429z" fill="#000000" p-id="4814"></path><path d="M256.031086 1005.714286a18.285714 18.285714 0 0 0 36.571428 0 18.285714 18.285714 0 0 0-36.571428 0z" fill="#90C380" p-id="4815"></path><path d="M274.3168 1024a18.322286 18.322286 0 0 1 0-36.571429 18.322286 18.322286 0 0 1 0 36.571429z m0-30.317714c-7.277714 0-13.092571 5.412571-13.092571 12.141714 0 6.765714 5.924571 12.178286 13.092571 12.178286 7.168 0 13.092571-5.412571 13.092571-12.178286 0-6.729143-5.924571-12.141714-13.092571-12.141714z" fill="#000000" p-id="4816"></path><path d="M585.173943 1005.714286a18.285714 18.285714 0 0 0 36.571428 0 18.285714 18.285714 0 0 0-36.571428 0z" fill="#90C380" p-id="4817"></path><path d="M603.459657 1024a18.322286 18.322286 0 0 1 0-36.571429 18.322286 18.322286 0 0 1 0 36.571429z m0-30.427429c-7.277714 0-13.092571 5.376-13.092571 12.141715 0 6.765714 5.924571 12.141714 13.092571 12.141714 7.168 0 13.092571-5.376 13.092572-12.141714 0-6.765714-5.924571-12.141714-13.092572-12.141715z" fill="#000000" p-id="4818"></path></svg>`;

  private blockIconEventBindThis = this.blockIconEvent.bind(this);
  private switchProtyleEventBindThis = this.switchProtyleEvent.bind(this);
  private editortitleiconEventBindThis = this.editortitleiconEvent.bind(this);
  private mobilekeyboardshowEventBindThis =
    this.mobilekeyboardshowEvent.bind(this);
  private mobilekeyboardhideEventBindThis =
    this.mobilekeyboardhideEvent.bind(this);

  private sendToPlugin = new SendTo();
  private hrefToRefPlugin = new HrefToRef();
  private doOnPastePlugin = new doOnPaste();
  private typographyPlugin = new TypographyGo();
  private randomNotePlugin = new RandomNote();
  private randomImagePlugin = new RandomImage();
  private memoPlugin = new Memo();
  private readPlugin = new Read();
  private bookmarkPlugin = new Bookmark();
  private dockShowAndHidePlugin = new DockShowAndHide();
  private adjustTitleLevelPlugin = new AdjustTitleLevel();
  public insertCss = new InsertCSS();
  private voiceNotesPlugin = new VoiceNotesPlugin();
  private showCustomPropertiesUnderTitle = new ShowCustomPropertiesUnderTitle();
  private readHelper = new ReadHelper();
  private dockLeftPlugins;
  private mobileHelperPlugin = new MobileHelper();
  private blockAttr = new BlockAttr();

  codeSnippets = [];
  //获取插件类实例
  init() {
    const plugin = registerPlugin(this);
    setPlugin(plugin);
  }

  //绑定文档块右键菜单
  editortitleiconEvent({ detail }: any) {
    settings.getFlag("convert") &&
      this.hrefToRefPlugin.editortitleiconEvent({ detail });
    settings.getFlag("adjustTitleLevel") &&
      this.adjustTitleLevelPlugin.editortitleiconEvent({ detail });

    settings.getFlag("read") &&
      this.readPlugin.editortitleiconEvent({ detail });
  }

  mobilekeyboardshowEvent({ detail }: any) {
    settings.getFlag("mobileHelper") &&
      this.mobileHelperPlugin.mobilekeyboardshowEvent({ detail });
  }

  mobilekeyboardhideEvent({ detail }: any) {
    settings.getFlag("mobileHelper") &&
      this.mobileHelperPlugin.mobilekeyboardhideEvent({ detail });
  }

  //编辑器切换事件
  switchProtyleEvent({ detail }: any) {
    settings.getFlag("dockShowAndHide") &&
      this.dockShowAndHidePlugin.switchProtyleEvent({ detail });

    // settings.getFlag("mobileHelper") &&
    //   this.mobileHelperPlugin.switchProtyleEvent({ detail });
  }

  //块右键菜单
  private blockIconEvent({ detail }: any) {
    settings.getFlag("convert") &&
      this.hrefToRefPlugin.blockIconEvent({ detail });

    // settings.getFlag("adjustTitleLevel") &&
    //   this.adjustTitleLevelPlugin.blockIconEvent({ detail });

    settings.getFlag("sendTo") && this.sendToPlugin.blockIconEvent({ detail });
    settings.getFlag("typography") &&
      this.typographyPlugin.blockIconEvent({ detail });
    settings.getFlag("bookmark") &&
      this.bookmarkPlugin.blockIconEvent({ detail });
    settings.getFlag("quickAttr") && this.blockAttr.blockIconEvent({ detail });

    settings.getFlag("voiceNotes") &&
      this.voiceNotesPlugin.blockIconEvent({ detail });
  }

  //App 准备好时加载
  async onLayoutReady() {
    settings.getFlag("randomHeaderImage") &&
      this.randomImagePlugin.onLayoutReady();

    this.eventBus.on("loaded-protyle-static", (event) => {
      settings.getFlag("randomHeaderImage") &&
        this.randomImagePlugin.setEvent(event);
      settings.getFlag("typography") && this.typographyPlugin.setEvent(event);
    });

    settings.getFlag("dockShowAndHide") &&
      this.dockShowAndHidePlugin.onLayoutReady();

    //这里注入CSS和JS
    settings.getFlag("codeSnippets") &&
      (await this.getCodeSnippets()) &&
      this.insertCss.onLayoutReady();

    this.blockAttr.onLayoutReady();

    this.showMoreIconsOnBar();
  }

  // 在边栏上注入的图标在onLayoutReady执行；为了避免同步插件配置改变后会执行 unload 逻辑，因此 load 需要再执行一下。
  showMoreIconsOnBar() {
    settings.getFlag("randomNote") && this.randomNotePlugin.onload();
    settings.getFlag("typography") && this.typographyPlugin.onload();
    settings.getFlag("voiceNotes") && this.voiceNotesPlugin.onload();
    this.dockLeftPlugins =
      settings.getFlag("dockLeft") &&
      settings
        .getBySpace("dockLeftConfig", "ids")
        .split("\n")
        .map((ele) => {
          const items = ele.split("====");
          let dockLeft = new DockLeft();
          dockLeft.icon = items[0];
          dockLeft.id = items[1];
          return dockLeft;
        });

    settings.getFlag("dockLeft") &&
      this.dockLeftPlugins &&
      this.dockLeftPlugins.forEach((ele) => {
        ele.onload();
      });
    settings.getFlag("mobileHelper") && this.mobileHelperPlugin.onload();
  }

  //App 启动时加载
  async onload() {
    this.init();
    await settings.initData();

    this.eventBus.on("click-blockicon", this.blockIconEventBindThis);
    this.eventBus.on("switch-protyle", this.switchProtyleEventBindThis);

    this.eventBus.on(
      "click-editortitleicon",
      this.editortitleiconEventBindThis
    );

    this.eventBus.on(
      "mobile-keyboard-show",
      this.mobilekeyboardshowEventBindThis
    );
    this.eventBus.on(
      "mobile-keyboard-hide",
      this.mobilekeyboardhideEventBindThis
    );

    settings.getFlag("doOnPaste") && this.doOnPastePlugin.onload();

    settings.getFlag("memo") && this.memoPlugin.onload();
    settings.getFlag("showCustomPropertiesUnderTitle") &&
      this.showCustomPropertiesUnderTitle.onload();

    settings.getBySpace("createDailyNoteConfig", "slashDiaryNote") &&
      loadSlashOfCreateDailyNote();
    settings.getBySpace("createDailyNoteConfig", "quickInput") &&
      quickNoteOnload(this);

    loadSlash();

    this.showMoreIconsOnBar();
  }

  //卸载逻辑
  onunload() {
    this.typographyPlugin.onunload();
    this.doOnPastePlugin.onunload();
    this.randomNotePlugin.onunload();
    this.randomImagePlugin.onunload();
    this.memoPlugin.onunload();
    this.voiceNotesPlugin.onunload();
    this.mobileHelperPlugin.onunload();
    this.blockAttr.onunload();
    this.dockLeftPlugins.forEach((ele) => {
      ele.onunload();
    });
  }

  openSetting(): void {
    this.openGlobalSetting();
  }

  openGlobalSetting(): void {
    let dialog = new Dialog({
      title: "配置",
      content: `<div id="hqweay-setting-pannel" style="height: 600px;"></div>`,
      width: "800px",
      destroyCallback: (options) => {
        console.log("destroyCallback", options);
        pannel.$destroy();
      },
    });

    let pannel = new SettingPannel({
      target: dialog.element.querySelector("#hqweay-setting-pannel"),
    });
  }

  updateProtyleToolbar(toolbar: Array<string | any>) {
    if (settings.getFlag("readHelper")) {
      toolbar = this.readHelper.updateProtyleToolbar(toolbar);
    }
    return toolbar;
  }

  async getCodeSnippets() {
    // if (this.codeSnippets.length !== 0) {
    //   return this.codeSnippets;
    // }
    return fetch(
      "https://api.github.com/repos/hqweay/siyuan-hqweay-go/issues/4/comments?per_page=100&page=0",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
      .then((response) => {
        if (response.ok) {
          if (response.ok) {
            return response.json().then((snippets) => {
              // let resultObj = JSON.parse(snippets);
              this.codeSnippets = snippets.map((ele) => {
                const body = ele.body;
                if (body.startsWith("```")) {
                  let metaInfos = body.split(/\r?\n/)[0].split("#");
                  return {
                    id: ele.node_id,
                    type: metaInfos[1] ? metaInfos[1] : "未知",
                    category: metaInfos[2] ? metaInfos[2] : "未知",
                    title: metaInfos[3] ? metaInfos[3] : "未知",
                    author: metaInfos[4] ? metaInfos[4] : "未知",
                    description: metaInfos[5] ? metaInfos[5] : "未知",
                    link: metaInfos[6] ? metaInfos[6] : "未知",
                    code: body.split(/\r?\n/).slice(1, -1).join("\r\n"),
                  };
                }
              });
              return this.codeSnippets;
            });
          } else {
            throw new Error("Failed to get file content");
          }
        } else {
          throw new Error("Failed to get file content");
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }
}
