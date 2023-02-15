import {
  IonButton,
  IonCol,
  IonContent,
  IonGrid,
  IonImg,
  IonInput,
  IonItem,
  IonList,
  IonPage,
  IonRouterLink,
  IonRow
} from "@ionic/react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import LoginFooter from "../components/LoginFooter";
import { Constants } from "../utils/constants/constants";
import { createNewPassword } from "../utils/services/Login.Service";
import "./Page.css";

const ForgotPassword: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [passwordShownNew, setPasswordShownNew] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [passwordShown2Reinput, setPasswordShownReinput] =
    useState<boolean>(false);
  const history = useHistory();
  const { register, handleSubmit } = useForm({ mode: "onChange" });

  useEffect(() => {
    let email = new URLSearchParams(window.location.search).get("email");
    setEmail(email);
  }, []);

  const createPassword = async (data) => {
    if (data.password === data.re_password) {
      fetchData(data);
    } else {
      toast.error(t("PASSWORD_ERROR_2"));
    }
  };

  const fetchData = async (data: any, isFirstLoading = true) => {
    let obj = {
      email: email,
      newPassword: data.password,
      verificationCode: data.verification_code,
    };
    let res = await createNewPassword(obj);
    if (res.status === Constants.API_SUCCESS) {
      toast.success(
        `New Password For ` + email + ` has been reset successfully!`
      );
      if (isFirstLoading) setLoading(false);
      history.push({
        pathname: "/login",
      });
    } else {
      toast.error(t("ERROR_CRIF_REPORT_UNEXPECTED"));
    }
  };

  return (
    <IonPage className="login-page">
      <IonContent className="white ion-padding">
        {/* Logo section */}
        <section className="logo">
          <IonItem lines="none" className="mb-40 mt-55">
            <IonImg className="mx-auto" src="./img/actyv-logo.svg"></IonImg>
          </IonItem>
        </section>
        <section className="login-text">
          <IonGrid>
            <IonRow>
              <IonCol>
                <h1 className="fs-24 fw-700 lh-34">{t("CREATE PASSWORD")}</h1>
                <p className="">{t("FORGET_PASSOWORD_NOTE")}</p>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>
        {/* login section */}
        <section className="login-form-wrapper mb-22">
          <form onSubmit={handleSubmit(createPassword)}>
            <IonGrid className="pb-0">
              <IonRow>
                <IonCol className="pb-0">
                  <IonList className="pb-0">
                    <IonItem lines="none" className="input-item mb-13">
                      <IonInput
                        placeholder={t("VERIFICATION CODE")}
                        {...register("verification_code")}
                      ></IonInput>
                    </IonItem>
                    <IonItem lines="none" className="input-item mb-13">
                      <IonInput
                        placeholder={t("NEW PASSWORD")}
                        type={passwordShownNew ? "text" : "password"}
                        {...register("password")}
                      ></IonInput>
                      {passwordShownNew ? (
                        <IonImg
                          src="./img/eye-show.svg"
                          onClick={() => {
                            setPasswordShownNew(!passwordShownNew);
                          }}
                        ></IonImg>
                      ) : (
                        <IonImg
                          src="./img/eye.svg"
                          onClick={() => {
                            setPasswordShownNew(!passwordShownNew);
                          }}
                        ></IonImg>
                      )}
                    </IonItem>
                    <IonItem lines="none" className="input-item mb-13">
                      <IonInput
                        placeholder={t("CONFIRM PASSWORD")}
                        type={passwordShown2Reinput ? "text" : "password"}
                        {...register("re_password")}
                      ></IonInput>

                      {passwordShown2Reinput ? (
                        <IonImg
                          src="./img/eye-show.svg"
                          onClick={() => {
                            setPasswordShownReinput(!passwordShown2Reinput);
                          }}
                        ></IonImg>
                      ) : (
                        <IonImg
                          src="./img/eye.svg"
                          onClick={() => {
                            setPasswordShownReinput(!passwordShown2Reinput);
                          }}
                        ></IonImg>
                      )}
                    </IonItem>
                  </IonList>
                </IonCol>
              </IonRow>
              <IonRow>
                <IonCol>
                  <IonRouterLink className="fs-11">
                    <IonButton
                      className="button-expand"
                      expand="block"
                      type="submit"
                    >
                      {t("CREATE PASSWORD_CAP")}
                    </IonButton>
                  </IonRouterLink>
                </IonCol>
              </IonRow>
            </IonGrid>
          </form>
        </section>
        <LoginFooter />
      </IonContent>
    </IonPage>
  );
};
export default ForgotPassword;
