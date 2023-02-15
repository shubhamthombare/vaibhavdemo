import { IonCard, IonCardContent, IonCol, IonImg, IonRow } from "@ionic/react";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Constants } from "../utils/constants/constants";
import {
  IDocCard,
  IPlatformDocument, IStep
} from "../utils/interfaces/DocumentVault.interface";
import { toast } from "react-toastify";
var classNames = require('classnames');

const getDocumentsSummary = (documents: Object[]) => {
  const allStatuses: any[] = [];
  _.forEach(documents, (d) => allStatuses.push(..._.get(d, "status", [])));
  return _.countBy(allStatuses, (status) => `${status.name}:${status.value}`);
};

function DocumentStatus(docType: string, steps: any) {

  switch (docType) {
    case "BANK_STATEMENT":
    case "GSTR_FILES":
      return (
        <IonCardContent
          key={`${docType}}_status`}
          className="py-20 card-content card-content-footer"
        >
          <IonRow 
          className={
            classNames(
              "nine-in-one",
              {
                "ion-justify-content-center":_.size(steps) === 1
              }
            )
          }
          
          >
            {steps.map((step, index) => {
              return (
                <IonCol key={`${index}}_key`}>
                  <div className="d-flex ion-justify-content-center ion-align-items-center">
                    <IonImg
                      title={step.title}
                      className=""
                      src={`./img/${step.status}.svg`}
                    ></IonImg>
                    {(index === 0 || index === _.size(steps) - 1) && (
                      <h4 className="tooltip-text fs-12 fw-600">
                        {" "}
                        {step.title}
                      </h4>
                    )}
                  </div>
                </IonCol>
              );
            })}
          </IonRow>
        </IonCardContent>
      );
    case "GSTR":
    case "ITR":
      return (
        <IonCardContent
          key={`${docType}}_status`}
          className="py-0 card-content card-content-footer"
        >
          <IonRow className="ion-justify-content-around">
            {steps.map((step, index) => {
              return (
                <IonCol size="auto" key={`${index}}_key`}>
                  <div className="">
                    <div className="d-flex ion-justify-content-center">
                      <IonImg
                        className=""
                        src={`./img/${step.status}.svg`}
                      ></IonImg>
                    </div>
                    <h4 className="fs-12 fw-600 ion-text-center">
                      {" "}
                      {step.title}
                    </h4>
                  </div>
                </IonCol>
              );
            })}
          </IonRow>
        </IonCardContent>
      );
    default:
      return (
        <IonCardContent
          key={`${docType}}_status`}
          className="py-0 card-content card-content-footer"
        >
          <IonRow className="ion-justify-content-center">
            <IonCol size="auto">
              <div className="d-flex ion-align-items-center">
                <IonImg
                  className="mr-10"
                  src={`./img/${steps[_.size(steps) - 1].status}.svg`}
                ></IonImg>
                <h4 className="fs-12 fw-600">
                  {steps[_.size(steps) - 1].title}
                </h4>
              </div>
            </IonCol>
          </IonRow>
        </IonCardContent>
      );
  }
}

function RenderDocumentCard(
  documents: Record<string, unknown>[],
  t: (input: string) => string,
  applicationId: string
) {
  const navigate = useHistory();
  const groupedDocuments = _.groupBy(documents, "statusTitle");

  let formPayload: any = {
    status: [],
    displayName: "",
    eVerificationRequired: true,
    icon: "",
  };

  _.forEach(documents, (document) => {
    const documentStatuses = _.isArray(document.status) ? document.status : [];
    formPayload = {
      ...formPayload,
      ...document,
      status: [...formPayload.status, ...documentStatuses],
    };
  });

  if (_.size(Object.keys(groupedDocuments)) > 1) {
    let status: any[] = [];
    Object.keys(groupedDocuments).map((documentStatusTitle) => {
      const groupedStatus = getDocumentsSummary(
        groupedDocuments[documentStatusTitle]
      );
      const isUploadError =
        Object.keys(groupedStatus).includes("UPLOAD:ERROR") &&
        _.get(groupedStatus, "UPLOAD:ERROR", 0) > 0;
      if (isUploadError) {
        status.push({
          name: "UPLOAD",
          value: "ERROR",
          description: "",
          title: documentStatusTitle,
        });
      } else {
        const isUploadPending =
          Object.keys(groupedStatus).includes("UPLOAD:PENDING") &&
          _.get(groupedStatus, "UPLOAD:PENDING", 0) > 0;
        const isUploadNotStarted =
          Object.keys(groupedStatus).includes("UPLOAD:NOT_STARTED") &&
          _.get(groupedStatus, "UPLOAD:NOT_STARTED", 0) > 0;
        if (isUploadPending || isUploadNotStarted) {
          status.push({
            name: "UPLOAD",
            value: "PENDING",
            description: "",
            title: documentStatusTitle,
          });
        } else {
          status.push({
            name: "UPLOAD",
            value: "COMPLETED",
            description: "",
            title: documentStatusTitle,
          });
        }
      }
    });
    formPayload.status = status;
  }

  const { status: allStatuses } = formPayload || { status: [] };
  const steps: IStep[] = [];

  const uploadStatuses = _.filter(allStatuses, { name: "UPLOAD" });

  uploadStatuses.map((uploadStatus) => {
    const { title, value, description } = uploadStatus;
    if (!uploadStatus.value) return;
    const mapping = {
      NOT_STARTED: {
        title: "UPLOAD_PENDING",
        status: "process",
      },
      PENDING: {
        title: "UPLOAD_PENDING",
        status: "process",
      },
      COMPLETED: {
        title: "UPLOAD_DONE",
        status: "finish",
      },
      ERROR: {
        title: "UPLOAD_ERROR",
        status: "error",
      },
    };

    steps.push({
      title: title || t(_.get(mapping, `${value}.title`)),
      description,
      status: _.get(mapping, `${value}.status`),
    });
  });

  const eVerificationRequired = formPayload?.eVerificationRequired;
  const eVerifyStatuses = _.filter(allStatuses, { name: "E_VERIFY" });

  eVerificationRequired &&
    eVerifyStatuses.map((eVerifyStatus) => {
      if (
        eVerifyStatus.value &&
        ["NOT_STARTED", "PENDING"].includes(eVerifyStatus.value)
      ) {
        steps.push({
          title: eVerifyStatus.title
            ? eVerifyStatus.title
            : t("EVERIFY_PENDING"),
          description: eVerifyStatus.description,
          status: "process",
        });
      }

      if (eVerifyStatus.value && ["COMPLETED"].includes(eVerifyStatus.value)) {
        steps.push({
          title: eVerifyStatus.title ? eVerifyStatus.title : t("EVERIFY_DONE"),
          description: eVerifyStatus.description,
          status: "finish",
        });
      }

      if (eVerifyStatus.value && ["ERROR"].includes(eVerifyStatus.value)) {
        steps.push({
          title: eVerifyStatus.title ? eVerifyStatus.title : t("EVERIFY_ERROR"),
          description: eVerifyStatus.description,
          status: "error",
        });
      }
    });

  const navigateToDocumentSpecificRoute = (documentType: string, route: string, tileInfo: object) => {    
    const customFormKey = _.get(tileInfo, "formKey", false);
    const title = t(_.get(tileInfo, "displayName"));
    const description = _.get(tileInfo, "description");
    const formattedDescription = !_.isEmpty(description) ? description : t(`${_.get(tileInfo, "displayName")}_DESCRIPTION`);

    if (customFormKey) {
      navigate.push(route, {
        state: { formKey: customFormKey, title, description: formattedDescription, applicationId },
      })
    }
    else {
      if (Object.keys(Constants.documentToRouteMapping).includes(documentType))
        navigate.push(route);
      else
        toast.warning(Constants.FEATURE_UNAVAILABLE_MSG);
    }
  };

  const getRouteEndPoint = (displayName: keyof IPlatformDocument) => {
    let endPoint;
    switch (true) {
      case displayName.includes('BANK_CUSTOM_FORM'): endPoint = Constants.documentToRouteMapping['BANK_CUSTOM_FORM'];
        break;

      case displayName.includes('CUSTOM_FORM'): endPoint = Constants.documentToRouteMapping['CUSTOM_FORM'];
        break;

      case displayName.includes('MISCELLANEOUS_DOCUMENT'): endPoint = Constants.documentToRouteMapping['MISCELLANEOUS_DOCUMENT'];
        break;

      default: endPoint = _.get(Constants.documentToRouteMapping, displayName);
        break;
    }
    return endPoint
  }
  let documentType = _.get(formPayload, "documentType")
    ? _.get(formPayload, "documentType")
    : _.get(formPayload, "displayName");


  return (
    <>
      <IonCard
        key={formPayload.documentType}
        className="primary-card br-8"
        onClick={() =>
          navigateToDocumentSpecificRoute(documentType,
            `/${getRouteEndPoint(documentType)}/edit`,
            formPayload
          )}>
        <IonCardContent className="card-content">
          <IonRow className="ion-align-items-center">
            <IonCol size="auto" className="py-0 pl-0">
              <div className="profile-wrap shadow-profile">
                <IonImg
                  src={formPayload?.icon}
                  alt={formPayload?.displayName}
                  className="with-profile"
                ></IonImg>
              </div>
            </IonCol>

            <IonCol size="" className="py-0 pr-0">
              <div className="wrap-374">
              <h3 className="fs-16 fw-600 ellipse">
                {t(formPayload?.displayName)}
              </h3>
              <p className="fs-12 fw-400">
                {formPayload.description
                  ? formPayload.description
                  : t(`${formPayload?.displayName}_DESCRIPTION`)}
              </p>
              </div>
            </IonCol>
          </IonRow>
        </IonCardContent>

        {DocumentStatus(documentType, steps)}
      </IonCard>
    </>
  );
}

const DocumentCard: React.FC<IDocCard> = ({
  data,
  verificationData,
  applicationId = "",
}) => {
  const { t } = useTranslation();

  return (
    <>
      {_.map(data, (documentNames, index) => {
        return (
          <>
            {_.map(documentNames, (a, b) => {
              return RenderDocumentCard(verificationData[a], t, applicationId);
            })}
          </>
        );
      })}
    </>
  );
};
export default DocumentCard;
