import { IonCard, IonCardContent, IonCol, IonGrid, IonImg, IonRow } from "@ionic/react";
import _ from "lodash";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { Constants, stepStatusIcons } from "../utils/constants/constants";
import { IPlatformDocument, IStep } from "../utils/interfaces/DocumentVault.interface";
import { toast } from "react-toastify";

var classNames = require('classnames');

export default function DocumentList({ verificationData, applicationId = "" }: { verificationData: Record<string, Record<string, unknown>[]>; applicationId: string }) {
    const navigate = useHistory();
    const { t } = useTranslation();
    const getDocumentsSummary = (documents: Object[]) => {
        const allStatuses: any[] = [];
        _.forEach(documents, d => allStatuses.push(..._.get(d, "status", [])));
        return _.countBy(allStatuses, status => `${status.name}:${status.value}`);
    };

    function RenderDocumentCard(documents: Record<string, unknown>[], applicationId: string) {

        const groupedDocuments = _.groupBy(documents, "statusTitle");
        let formPayload: any = {
            status: [],
            displayName: "",
            eVerificationRequired: true,
            icon: "",
        };
        _.forEach(documents, document => {
            const documentStatuses = _.isArray(document.status) ? document.status : []
            formPayload = {
                ...formPayload,
                ...document,
                status: [...formPayload.status, ...documentStatuses],
            };
        });

        if (_.size(Object.keys(groupedDocuments)) > 1) {
            let status: any[] = [];
            Object.keys(groupedDocuments).map(documentStatusTitle => {
                const groupedStatus = getDocumentsSummary(groupedDocuments[documentStatusTitle]);
                const isUploadError = Object.keys(groupedStatus).includes("UPLOAD:ERROR") && _.get(groupedStatus, "UPLOAD:ERROR", 0) > 0;
                if (isUploadError) {
                    status.push({ name: "UPLOAD", value: "ERROR", description: "", title: documentStatusTitle });
                } else {
                    const isUploadPending = Object.keys(groupedStatus).includes("UPLOAD:PENDING") && _.get(groupedStatus, "UPLOAD:PENDING", 0) > 0;
                    const isUploadNotStarted = Object.keys(groupedStatus).includes("UPLOAD:NOT_STARTED") && _.get(groupedStatus, "UPLOAD:NOT_STARTED", 0) > 0;
                    if (isUploadPending || isUploadNotStarted) {
                        status.push({ name: "UPLOAD", value: "PENDING", description: "", title: documentStatusTitle });
                    } else {
                        status.push({ name: "UPLOAD", value: "COMPLETED", description: "", title: documentStatusTitle });
                    }
                }
            });
            formPayload.status = status;
        }

        const { status: allStatuses } = formPayload || { status: [] };
        const steps: IStep[] = [];

        const uploadSteps: IStep[] = [];
        const eVerifySteps: IStep[] = [];
        const uploadStatuses = _.filter(allStatuses, { name: "UPLOAD" });

        uploadStatuses.map(uploadStatus => {

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

            uploadSteps.push({
                title: title || t(_.get(mapping, `${value}.title`)),
                description,
                status: _.get(mapping, `${value}.status`),
            });

        });

        const eVerificationRequired = formPayload?.eVerificationRequired;
        const lastNoOfMonthsRequired = formPayload?.lastNoOfMonthsRequired
        const eVerifyStatuses = _.filter(allStatuses, { name: "E_VERIFY" });

        let isEverificationDone = false
        eVerificationRequired && eVerifyStatuses.map(eVerifyStatus => {
            if (eVerifyStatus.value && ["NOT_STARTED", "PENDING"].includes(eVerifyStatus.value)) {
                eVerifySteps.push({
                    title: eVerifyStatus.title ? eVerifyStatus.title : t("EVERIFY_PENDING"),
                    description: eVerifyStatus.description,
                    status: "process",
                });
            }

            if (eVerifyStatus.value && ["COMPLETED"].includes(eVerifyStatus.value)) {
                eVerifySteps.push({
                    title: eVerifyStatus.title ? eVerifyStatus.title : t("EVERIFY_DONE"),
                    description: eVerifyStatus.description,
                    status: "finish",
                });
                isEverificationDone = true
            }

            if (eVerifyStatus.value && ["ERROR"].includes(eVerifyStatus.value)) {
                eVerifySteps.push({
                    title: eVerifyStatus.title ? eVerifyStatus.title : t("EVERIFY_ERROR"),
                    description: eVerifyStatus.description,
                    status: "error",
                });
                isEverificationDone = true
            }
        });
        let showTitleBelow = ["GSTR", "ITR"].includes(formPayload.displayName)
        let canShowTitle = !["BANK_STATEMENT", "GSTR_FILES"].includes(formPayload.displayName)

        if (!isEverificationDone && _.size(uploadSteps) && uploadSteps[0].status === 'process') {
            steps.push(...uploadSteps)
            if (formPayload.displayName === "GSTR")
                showTitleBelow = true
            else
                showTitleBelow = false
            canShowTitle = true
        }
        else {
            if (lastNoOfMonthsRequired === 0) {
                if (_.size(eVerifySteps))
                    steps.push(...eVerifySteps)
                else
                    steps.push(...uploadSteps)                
            }
            else
                steps.push(...uploadSteps, ...eVerifySteps)
        }
        let breakStepsRow = _.size(steps) >= Constants.DOCUMENT_STEPS_BREAK_AFTER_LENGTH
    
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

        let documentType = _.get(formPayload, 'documentType') ? _.get(formPayload, 'documentType') : _.get(formPayload, 'displayName');
        return (<>
            <IonCard className="primary-card br-8" onClick={() =>
                navigateToDocumentSpecificRoute(
                    documentType,
                    `/${getRouteEndPoint(documentType)}/edit`,
                    formPayload
                )
            }>
                <IonCardContent className="card-content">
                    <IonRow className="ion-align-items-center">
                        <IonCol size="auto" className="py-0 pl-0">
                            <div className="profile-wrap shadow-profile">
                                <IonImg
                                    src={formPayload?.icon} alt={formPayload?.displayName}
                                    className="with-profile"
                                ></IonImg>
                            </div>
                        </IonCol>

                        <IonCol size="" className="py-0 pr-0">

                            <h3 className="fs-16 fw-600 ellipse">{t(formPayload?.displayName)}</h3>
                            <p className="fs-12 fw-400">
                                {formPayload.description ? formPayload.description : t(`${formPayload?.displayName}_DESCRIPTION`)}
                            </p>
                        </IonCol>
                    </IonRow>
                </IonCardContent>

                <IonCardContent className="py-0 card-content card-content-footer">
                    <IonGrid>
                        {
                            breakStepsRow && (
                                <IonRow>
                                    <IonCol size="12">
                                        <h4 className="fs-12 fw-600">
                                            {steps[0].title}
                                        </h4>
                                    </IonCol>
                                </IonRow>
                            )
                        }
                        <IonRow
                            style={{

                                display: 'flex',
                                justifyContent: _.size(steps) === 1 ? 'center' : 'space-between'
                            }}>
                            {steps.map((step) => {
                                // TODO: Show status message 
                                // const description = step.description;

                                return (
                                    <div className="ion-justify-content-center ion-align-items-center" style={{
                                        display: 'flex',
                                        flexDirection: showTitleBelow ? "column" : "row",
                                        width: breakStepsRow ? `${100 / (_.size(steps) / 2)}%` : 'inherit',
                                        paddingTop: '4px',
                                        paddingBottom: '4px',
                                    }}>
                                        <img
                                            className={classNames(
                                                "ion-align-self-center",
                                                {
                                                    "mr-10": canShowTitle && !showTitleBelow
                                                }
                                            )}
                                            src={stepStatusIcons[step.status]}
                                            alt={step.status}
                                        />

                                        {canShowTitle &&
                                            (
                                                <h4 className="fs-12 fw-600">
                                                    {step.title}
                                                </h4>
                                            )
                                        }
                                    </div>
                                );
                            })}
                        </IonRow>
                        {
                            breakStepsRow && (
                                <IonRow>
                                    <IonCol className="ion-text-end" size="12">
                                        <h4 className="fs-12 fw-600">
                                            {steps[_.size(steps) - 1].title}
                                        </h4>

                                    </IonCol>
                                </IonRow>
                            )
                        }
                    </IonGrid>
                </IonCardContent>
            </IonCard>
        </>)
    }
    return (
        <>
            {Object.keys(verificationData).map((documentName: string, index: number) => (
                <>
                    {RenderDocumentCard(
                        verificationData[documentName as keyof IPlatformDocument],
                        applicationId
                    )}

                </>
            ))}
        </>

    );
}