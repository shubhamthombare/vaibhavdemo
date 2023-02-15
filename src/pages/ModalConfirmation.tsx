import { OverlayEventDetail } from "@ionic/core";
import {
  IonButton, IonCardContent,
  IonCol,
  IonContent,
  IonGrid, IonModal,
  IonPage,
  IonRow,
  useIonModal
} from "@ionic/react";
import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import ConfirmationModal from "./ConfirmationModal";

const ModalConfirmation: React.FC = () => {
  const { t } = useTranslation();
  const modal = useRef<HTMLIonModalElement>(null);
  const [confirmationModal, dismissVerifyCaptchaModal] = useIonModal(ConfirmationModal, {
    onDismiss: (data: string, role: string) => dismissVerifyCaptchaModal(data, role),    
  });

  function dismiss() {
    modal.current?.dismiss();
  }

  const showConfirmationModal =()=>{
    confirmationModal({
      cssClass: "confirmation-modal",
      onWillDismiss: async (ev: CustomEvent<OverlayEventDetail>) => {

      },
    });
  }

  return (
    <IonPage>
      <Header />
      <IonContent className="ion-padding">
        <IonButton onClick={showConfirmationModal} expand="block">
          {t("OPEN_MODAL")}
        </IonButton>
        <IonModal id="confirmation-modal" ref={modal} trigger="open-modal">
          <IonGrid>
            <IonRow className="ion-justify-content-center">
              <IonCol size="10">
                <div className="modal-text py-10">
                  <p className="fs-18 fw-600 ion-text-center">
                    {t("MODAL_HEADER")}
                  </p>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
          <IonCardContent className="footer-gradient">
            <IonGrid>
              <IonRow className="">
                <IonCol size="6" className="ion-text-center">
                  <IonButton shape="round" className="fs-18 fw-600  button-round button-solid">{t("MODAL_BTN_YES")}</IonButton>
                </IonCol>
                <IonCol size="6" className="ion-text-center">
                  <IonButton fill="outline" shape="round" onClick={() => dismiss()} className="fs-18 fw-600 native-white-bg button-outline-primary button-round ">{t("CANCEL")}</IonButton>
                </IonCol>
              </IonRow>
            </IonGrid>
          </IonCardContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default ModalConfirmation;
